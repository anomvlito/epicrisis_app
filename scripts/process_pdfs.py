#!/usr/bin/env python3
"""
Procesa los 27 PDFs de prueba:
1. Extrae y anonimiza el texto de cada PDF
2. Genera un patient_id único y persistente por archivo
3. Copia el PDF a backend/uploads/{patient_id}.pdf
4. Genera seed_data_pdfs.json listo para importar a la DB
"""

import hashlib, hmac, json, re, shutil, os
from pathlib import Path
import pdfplumber

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
ROOT         = SCRIPT_DIR.parent
PDF_DIR      = Path("/Users/fabianortega/src/proyecto_sotero_ihealth/pipeline/PDFs_prueba-input")
UPLOADS_DIR  = ROOT / "backend" / "uploads"
SALT_FILE    = SCRIPT_DIR / ".pdf_salt"
OUTPUT_JSON  = SCRIPT_DIR / "seed_data_pdfs.json"

# Password fija — cámbiala si quieres más seguridad
HMAC_PASSWORD = b"epicrisis-ihealth-2026"

# ── Salt persistente ─────────────────────────────────────────────────────────
def load_or_create_salt() -> bytes:
    if SALT_FILE.exists():
        return bytes.fromhex(SALT_FILE.read_text().strip())
    salt = os.urandom(32)
    SALT_FILE.write_text(salt.hex())
    print(f"✓ Nuevo salt guardado en {SALT_FILE}")
    return salt

# ── Genera patient_id desde el stem del PDF ──────────────────────────────────
def make_patient_id(stem: str, salt: bytes) -> str:
    key = HMAC_PASSWORD + salt
    h = hmac.new(key, stem.encode("utf-8"), hashlib.sha256)
    return h.hexdigest()[:16].upper()

# ── Anonimización básica del texto ────────────────────────────────────────────
RUT_PATTERN  = re.compile(r'\b\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3}[-–]?[0-9kK]\b')
DATE_OF_BIRTH = re.compile(r'(?i)(fecha\s+de?\s+nac[^\w][^\n]{0,30})\d{1,2}[/-]\d{1,2}[/-]\d{2,4}')

def anonymize_text(text: str, stem: str) -> str:
    # Reemplaza nombre del paciente (variantes del stem)
    variants = sorted({stem, stem.replace(" ", ""), stem.replace("-", " ")}, key=len, reverse=True)
    for v in variants:
        if len(v) > 3:
            text = re.sub(re.escape(v), '[ANONIMIZADO]', text, flags=re.IGNORECASE)

    # Reemplaza RUT
    text = RUT_PATTERN.sub('[RUT ANONIMIZADO]', text)

    # Reemplaza etiquetas nombre/paciente seguidas de valor
    for label in ['Nombre', 'Paciente', 'Nombre completo', 'Nombre del paciente']:
        text = re.sub(
            rf'(?i)({re.escape(label)}\s*[:：]\s*)([^\n]{{2,60}})',
            r'\1[ANONIMIZADO]',
            text
        )

    return text

# ── Extrae texto del PDF ──────────────────────────────────────────────────────
def extract_pdf_text(pdf_path: Path) -> str:
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                pages.append(t.strip())
    return "\n\n".join(pages)

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    salt = load_or_create_salt()

    pdfs = sorted([p for p in PDF_DIR.glob("*.pdf") if not p.name.startswith("~$")])
    print(f"Encontrados {len(pdfs)} PDFs\n")

    records = []
    errors  = []

    for i, pdf_path in enumerate(pdfs, 1):
        stem = pdf_path.stem
        patient_id = make_patient_id(stem, salt)
        dest = UPLOADS_DIR / f"{patient_id}.pdf"

        print(f"[{i:02d}/{len(pdfs)}] {stem}")
        print(f"       → patient_id: {patient_id}")

        try:
            raw_text = extract_pdf_text(pdf_path)
            if not raw_text.strip():
                print(f"       ⚠ PDF vacío o no extraíble, se omite texto")
                anon_text = ""
            else:
                anon_text = anonymize_text(raw_text, stem)

            shutil.copy2(pdf_path, dest)
            print(f"       → Copiado a uploads/")

            records.append({
                "patientId": patient_id,
                "pdfPath": f"{patient_id}.pdf",
                "contentMarkdown": anon_text,
                "direccion": "",
                "quintilEstimado": "",
                "prevision": "",
                "tipoPrevision": "",
                "quintilTeorico": "",
                "concordanciaGse": "",
                "hacinamientoManzana": "",
                "confianzaGeocodificacion": "",
                "estadoMortalidad": "",
                "fechaIngresoHosp": "",
                "fechaEgresoHosp": "",
                "fechaIngresoUci": "",
                "fechaEgresoUci": "",
                "comentarioFinal": "",
            })

        except Exception as e:
            print(f"       ✗ ERROR: {e}")
            errors.append({"file": stem, "error": str(e)})

    OUTPUT_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print(f"\n✓ {len(records)} registros → {OUTPUT_JSON}")
    print(f"✓ PDFs copiados a {UPLOADS_DIR}")
    if errors:
        print(f"✗ {len(errors)} errores: {[e['file'] for e in errors]}")

if __name__ == "__main__":
    main()
