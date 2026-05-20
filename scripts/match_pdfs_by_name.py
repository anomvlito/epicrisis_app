#!/usr/bin/env python3
"""
Empareja PDFs de db/momentaneo/ con registros de la DB usando nombre de paciente.

Estrategia:
1. Extrae el nombre del paciente del nombre del archivo PDF (quita "PREV Fonasa X", "PREV Otra", etc.)
2. Normaliza acentos y mayúsculas para comparación
3. Busca ese nombre en content_markdown usando similitud de string
4. Para coincidencias con score >= THRESHOLD: actualiza pdf_path y pdf_data
"""
import hashlib
import os
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import psycopg2

SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent
PDF_DIR = ROOT / "db" / "momentaneo"
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://fabianortega@localhost:5432/epicrisis_dev")

# Similitud mínima para aceptar un match (0-1)
THRESHOLD = 0.72
# Longitud mínima del nombre extraído (evita "Ana" -> falsos positivos)
MIN_NAME_LEN = 10


def normalize(text: str) -> str:
    """Quita acentos y convierte a minúsculas."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def extract_name_from_stem(stem: str) -> str:
    """
    'Alfonso Daniel Guarda Sepulveda PREV Fonasa C' -> 'Alfonso Daniel Guarda Sepulveda'
    'Alicia Paola Guzman Hernandez PREV Otra'       -> 'Alicia Paola Guzman Hernandez'
    'Aixa Ainara Caro Miranda'                      -> 'Aixa Ainara Caro Miranda'
    'Ana Maria Collao Faundez PREV Otra B'          -> 'Ana Maria Collao Faundez'
    """
    name = re.sub(r'\s+PREV\s+.*$', '', stem, flags=re.IGNORECASE).strip()
    name = re.sub(r'\s+(Fonasa\s+[A-D]|Otra\s*[A-Z]?)\s*$', '', name, flags=re.IGNORECASE).strip()
    return name


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def find_name_in_text(name_normalized: str, content_normalized: str) -> float:
    """
    Busca el nombre (normalizado) dentro del contenido del record.
    Devuelve el mejor score encontrado.
    """
    # Búsqueda directa de subcadena
    if name_normalized in content_normalized:
        return 1.0

    # Similitud contra ventanas del mismo tamaño en el contenido
    name_len = len(name_normalized)
    best = 0.0
    step = max(1, name_len // 3)
    for i in range(0, min(600, len(content_normalized) - name_len + 1), step):
        window = content_normalized[i:i + name_len]
        score = similarity(name_normalized, window)
        if score > best:
            best = score
        if best >= 1.0:
            break

    # También comparación token-based (apellidos)
    pdf_tokens = set(name_normalized.split())
    for line in content_normalized.splitlines()[:40]:
        line_tokens = set(line.split())
        if len(pdf_tokens) >= 2 and len(pdf_tokens & line_tokens) >= 2:
            token_score = len(pdf_tokens & line_tokens) / len(pdf_tokens)
            if token_score > best:
                best = token_score

    return best


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("SELECT patient_id, content_markdown, prevision FROM epicrisis WHERE pdf_data IS NULL")
    records = cur.fetchall()
    print(f"{len(records)} registros sin PDF en DB")

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    print(f"{len(pdfs)} PDFs en {PDF_DIR}\n")

    # Pre-normalizar contenidos de DB
    db_records = []
    for patient_id, content, prevision in records:
        content_norm = normalize(content or "")
        db_records.append((patient_id, content_norm, prevision or ""))

    updated = 0
    ambiguous = 0
    not_found = 0

    for pdf_path in pdfs:
        stem = pdf_path.stem
        name = extract_name_from_stem(stem)
        if len(name) < MIN_NAME_LEN:
            print(f"[SKIP]  {stem!r} — nombre muy corto ({name!r})")
            continue

        name_norm = normalize(name)

        scored = []
        for patient_id, content_norm, prevision in db_records:
            score = find_name_in_text(name_norm, content_norm)
            if score >= THRESHOLD:
                scored.append((score, patient_id, prevision))

        if not scored:
            not_found += 1
            print(f"[MISS]  {name!r} → sin match (threshold={THRESHOLD})")
            continue

        scored.sort(reverse=True)
        best_score, best_id, best_prev = scored[0]

        # Detectar ambigüedad: varios matches con score similar
        if len(scored) > 1 and scored[1][0] >= THRESHOLD and (best_score - scored[1][0]) < 0.05:
            ambiguous += 1
            runners = [(s, pid) for s, pid, _ in scored[:3]]
            print(f"[AMBIG] {name!r} → score={best_score:.2f} ({best_id}) pero también {runners[1:]}")
            continue

        # Actualizar DB
        filename = f"{best_id}.pdf"
        pdf_data = pdf_path.read_bytes()
        cur.execute(
            "UPDATE epicrisis SET pdf_path = %s, pdf_data = %s WHERE patient_id = %s",
            (filename, psycopg2.Binary(pdf_data), best_id),
        )

        if cur.rowcount > 0:
            updated += 1
            print(f"[OK]    {name!r} → {best_id} (score={best_score:.2f}, prev={best_prev})")
        else:
            print(f"[ERR]   {name!r} → {best_id} pero UPDATE no afectó filas")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n{'='*60}")
    print(f"Actualizados : {updated}")
    print(f"Ambiguos     : {ambiguous}")
    print(f"Sin match    : {not_found}")
    print(f"Total PDFs   : {len(pdfs)}")


if __name__ == "__main__":
    main()
