#!/usr/bin/env python3
"""
Empareja PDFs de db/momentaneo/ con registros de la DB usando dirección + fecha de ingreso.
Todos los PDFs son formato "Epicrisis Hospitalaria" y tienen campos estructurados.
Solo procesa registros que AÚN NO tienen pdf_data.
"""
import os
import re
from pathlib import Path

import pdfplumber
import psycopg2

SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent
PDF_DIR = ROOT / "db" / "momentaneo"
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://fabianortega@localhost:5432/epicrisis_dev")


def normalize(text: str) -> str:
    """Normaliza para comparación: minúsculas, espacios simples."""
    return re.sub(r'\s+', ' ', text.lower()).strip()


def extract_fields(text: str) -> dict:
    """Extrae dirección y fechas de texto del PDF."""
    m_dir = re.search(r'Direcci[oó]n:\s*(.+?)(?:Comuna\s*:|Informaci)', text, re.DOTALL)
    direccion = normalize(m_dir.group(1)) if m_dir else None

    m_ing = re.search(r'Fecha Ingreso\s*:\s*(\d{1,2}/\d{1,2}/\d{4})', text)
    fecha_ingreso = m_ing.group(1) if m_ing else None

    m_egr = re.search(r'Fecha Egreso\s*:\s*(\d{1,2}/\d{1,2}/\d{4})', text)
    fecha_egreso = m_egr.group(1) if m_egr else None

    return {"direccion": direccion, "fecha_ingreso": fecha_ingreso, "fecha_egreso": fecha_egreso}


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT patient_id, LOWER(REGEXP_REPLACE(direccion, '\\s+', ' ', 'g')),
               fecha_ingreso_hosp, fecha_egreso_hosp
        FROM epicrisis
        WHERE pdf_data IS NULL
    """)
    records = cur.fetchall()
    print(f"{len(records)} registros sin PDF en DB")

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    print(f"{len(pdfs)} PDFs en {PDF_DIR}\n")

    # Index DB records by (dir_norm, fecha_ingreso)
    by_dir_date: dict[tuple, list] = {}
    for pid, direccion, fi, fe in records:
        if direccion and fi:
            key = (normalize(direccion or ''), fi)
            by_dir_date.setdefault(key, []).append(pid)

    updated = 0
    ambiguous = 0
    not_found = 0
    errors = 0

    for pdf_path in pdfs:
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages[:2])
        except Exception as e:
            errors += 1
            print(f"[ERR]   {pdf_path.name[:60]} → {e}")
            continue

        fields = extract_fields(text)
        if not fields["direccion"] or not fields["fecha_ingreso"]:
            not_found += 1
            print(f"[SKIP]  {pdf_path.stem[:60]} → sin dirección/fecha en PDF")
            continue

        key = (fields["direccion"], fields["fecha_ingreso"])
        matches = by_dir_date.get(key, [])

        if not matches:
            not_found += 1
            print(f"[MISS]  {pdf_path.stem[:55]} → {fields['fecha_ingreso']} {fields['direccion'][:35]}")
            continue

        if len(matches) > 1:
            ambiguous += 1
            print(f"[AMBIG] {pdf_path.stem[:55]} → {len(matches)} matches: {matches}")
            continue

        patient_id = matches[0]
        filename = f"{patient_id}.pdf"
        pdf_data = pdf_path.read_bytes()

        cur.execute(
            "UPDATE epicrisis SET pdf_path = %s, pdf_data = %s WHERE patient_id = %s",
            (filename, psycopg2.Binary(pdf_data), patient_id),
        )
        if cur.rowcount > 0:
            updated += 1
            # Remove from index to avoid double-assignment
            del by_dir_date[key]
            print(f"[OK]    {pdf_path.stem[:55]} → {patient_id} ({fields['fecha_ingreso']})")
        else:
            print(f"[ERR]   {pdf_path.stem[:55]} → UPDATE falló para {patient_id}")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n{'='*60}")
    print(f"Actualizados : {updated}")
    print(f"Ambiguos     : {ambiguous}")
    print(f"Sin match    : {not_found}")
    print(f"Errores      : {errors}")
    print(f"Total PDFs   : {len(pdfs)}")


if __name__ == "__main__":
    main()
