#!/usr/bin/env python3
"""
Re-extrae 'motivo_ingreso' desde los PDF binarios almacenados en PostgreSQL.
Lee pdf_data directamente de la DB, sin necesitar los archivos originales.
"""
import io
import re
import psycopg2
import pdfplumber

DB_URL = "postgresql://fabianortega@localhost:5432/epicrisis_dev"

MOTIVO_MARKERS = [
    'MOTIVO O DIAGNÓSTICO DE INGRESO',
    'MOTIVO O DIAGNOSTICO DE INGRESO',
]

NEXT_MARKERS = [
    'ANTECEDENTES MÉDICOS DETALLADOS', 'ANTECEDENTES MEDICOS DETALLADOS',
    'COMORBILIDADES', 'PROCEDIMIENTOS',
    'INTERVENCIONES QUIRÚRGICAS', 'INTERVENCIONES QUIRURGICAS',
    'EPIDEMIOLOGÍA', 'EPIDEMIOLOGIA',
    'DIAGNÓSTICO DE EGRESO', 'DIAGNOSTICO DE EGRESO',
    'CONDICIÓN DE EGRESO', 'CONDICION DE EGRESO',
    'PLAN POST ALTA', 'INDICACIONES', 'CONTROLES',
    'TIPO DE REPOSO', 'EGRESO CON CATÉTER DOBLE J', 'EGRESO CON CATETER DOBLE J',
]

MARKER_RE = re.compile(
    r'^(' + '|'.join(re.escape(m) for m in MOTIVO_MARKERS) + r')\s*$',
    re.MULTILINE | re.IGNORECASE,
)
END_RE = re.compile(
    r'^(' + '|'.join(re.escape(m) for m in NEXT_MARKERS) + r')\s*$',
    re.MULTILINE | re.IGNORECASE,
)

def extract_text_from_bytes(pdf_bytes: bytes) -> str:
    pages = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                pages.append(t.strip())
    return '\n\n'.join(pages)

def find_motivo(text: str):
    m = MARKER_RE.search(text)
    if not m:
        return None
    after = text[m.end():]
    end = END_RE.search(after)
    content = after[:end.start()].strip() if end else after.strip()
    content = re.sub(r'\n{3,}', '\n\n', content).strip()
    return content if len(re.sub(r'\s', '', content)) >= 5 else None

def main():
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()

    cur.execute("SELECT epicrisis_id FROM epicrisis_sections WHERE section_name = 'motivo_ingreso'")
    already = {row[0] for row in cur.fetchall()}
    print(f"Ya tienen motivo_ingreso: {len(already)}")

    cur.execute("SELECT id, pdf_data FROM epicrisis WHERE pdf_data IS NOT NULL")
    rows = cur.fetchall()
    print(f"PDFs a procesar: {len(rows)}\n")

    found = skipped = failed = 0
    for epicrisis_id, pdf_data in rows:
        if epicrisis_id in already:
            skipped += 1
            continue
        try:
            text    = extract_text_from_bytes(bytes(pdf_data))
            motivo  = find_motivo(text)
            if motivo:
                cur.execute(
                    """
                    INSERT INTO epicrisis_sections (epicrisis_id, section_name, label, content, position)
                    VALUES (%s, 'motivo_ingreso', 'Motivo o Diagnóstico de Ingreso', %s, 2)
                    ON CONFLICT (epicrisis_id, section_name) DO UPDATE SET content = EXCLUDED.content
                    """,
                    (epicrisis_id, motivo),
                )
                conn.commit()
                found += 1
                print(f"  OK  id={epicrisis_id}: {motivo[:60].replace(chr(10),' ')}")
            else:
                skipped += 1
        except Exception as e:
            conn.rollback()
            failed += 1
            print(f"  ERR id={epicrisis_id}: {e}")

    cur.close()
    conn.close()
    print(f"\n✓ Extraídos: {found}  Sin marcador: {skipped}  Errores: {failed}")

if __name__ == '__main__':
    main()
