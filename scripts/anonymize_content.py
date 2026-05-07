"""
Limpia PII residual en contentMarkdown:
  1. Firmas médicas: "Nombre Apellido\n\nDD-MM-YYYY HH:MM:SS"
  2. Nombres de contactos/familiares: "Contacto X Y Z (hija)"
  3. Sociales con nombres: "vive con hija Nombre Apellido"

Uso:
  python3 scripts/anonymize_content.py --dry-run   # solo reporta
  python3 scripts/anonymize_content.py              # actualiza seed_data.json + Neon DB
"""
import json
import re
import sys
import os
from pathlib import Path

DRY_RUN = '--dry-run' in sys.argv

# ── Patrones de PII ────────────────────────────────────────────────────────────

# Firma médica: una línea con nombre propio seguida de fecha-hora
# Ej: "Andres Aquevedo Salazar\n\n13-10-2024 16:24:37"
# Usa [^\S\n]+ (espacios sin newline) para no cruzar líneas en el nombre
FIRMA_RE = re.compile(
    r'^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:[^\S\n]+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}){1,3})'
    r'(\s*\n\s*\d{1,2}[-/]\d{1,2}[-/]\d{4}[^\S\n]+\d{1,2}:\d{2}(?::\d{2})?)',
    re.MULTILINE,
)

# Contacto con nombre: "Contacto Barbara Pino (hija)"
CONTACTO_RE = re.compile(
    r'(?i)(contacto\s+)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})+)',
)

# Sociales con nombre propio: "hija Nombre Apellido" / "esposa Nombre Apellido"
FAMILIAR_RE = re.compile(
    r'(?i)((?:hija?|hijo|esposa?|marido|cónyuge|pareja|hermana?|hermano|madre|padre)\s+)'
    r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})+)',
)

MEDICAL_TERMS = {
    'Anamnesis', 'Antecedentes', 'Diagnósticos', 'Diagnóstico', 'Evolución',
    'Resumen', 'Procedimientos', 'Laboratorio', 'Ingreso', 'Egreso',
    'Crisis', 'Shock', 'Sepsis', 'Manejo', 'Renal', 'Pulmonar', 'Hepático',
    'Cardíaco', 'Cerebral', 'Vascular', 'Remota', 'Próxima', 'Mórbidos',
    'Hospitalaria', 'Quirúrgica', 'Posterior', 'Previo', 'Inicial',
}


def is_medical_phrase(name: str) -> bool:
    return any(term in name for term in MEDICAL_TERMS)


def clean_markdown(text: str) -> tuple[str, list[str]]:
    """Retorna (texto_limpio, lista_de_cambios)."""
    changes = []

    # 1. Firmas médicas
    def replace_firma(m):
        name = m.group(1)
        if is_medical_phrase(name):
            return m.group(0)
        changes.append(f'FIRMA: "{name}"')
        return f'[FIRMA MÉDICO ANONIMIZADA]{m.group(2)}'

    text = FIRMA_RE.sub(replace_firma, text)

    # 2. Contactos
    def replace_contacto(m):
        name = m.group(2)
        if is_medical_phrase(name):
            return m.group(0)
        changes.append(f'CONTACTO: "{name}"')
        return f'{m.group(1)}[ANONIMIZADO]'

    text = CONTACTO_RE.sub(replace_contacto, text)

    # 3. Familiares con nombre propio
    def replace_familiar(m):
        name = m.group(2)
        if is_medical_phrase(name):
            return m.group(0)
        changes.append(f'FAMILIAR: "{name}"')
        return f'{m.group(1)}[ANONIMIZADO]'

    text = FAMILIAR_RE.sub(replace_familiar, text)

    return text, changes


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    json_path = Path(__file__).parent / 'seed_data.json'
    with open(json_path) as f:
        data = json.load(f)

    total_changes = 0
    records_affected = 0

    for i, record in enumerate(data):
        md = record.get('contentMarkdown', '')
        cleaned, changes = clean_markdown(md)

        if changes:
            records_affected += 1
            total_changes += len(changes)
            print(f'Registro {i} ({len(changes)} cambios):')
            for c in changes[:5]:
                print(f'  - {c}')
            if len(changes) > 5:
                print(f'  ... y {len(changes)-5} más')

            if not DRY_RUN:
                record['contentMarkdown'] = cleaned

    print(f'\n{"[DRY RUN] " if DRY_RUN else ""}Total: {records_affected} registros afectados, {total_changes} ocurrencias de PII')

    if DRY_RUN:
        print('\nEjecuta sin --dry-run para aplicar los cambios.')
        return

    # Guardar seed_data.json limpio
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'\n✓ {json_path} actualizado.')

    # Actualizar Neon DB
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print('\n⚠ DATABASE_URL no está definida. Carga el .env y vuelve a ejecutar para actualizar la DB.')
        print('  Ejemplo: source .env && python3 scripts/anonymize_content.py')
        return

    try:
        import psycopg2
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        updated = 0
        for i, record in enumerate(data):
            cur.execute(
                'UPDATE epicrisis SET content_markdown = %s WHERE patient_id = %s',
                (record['contentMarkdown'], record['patientId'])
            )
            if cur.rowcount > 0:
                updated += 1
        conn.commit()
        cur.close()
        conn.close()
        print(f'✓ DB Neon actualizada: {updated} registros.')
    except ImportError:
        print('\n⚠ psycopg2 no instalado. Instala con: pip install psycopg2-binary')
        print('  El seed_data.json ya fue limpiado. Para actualizar la DB ejecuta:')
        print('  pip install psycopg2-binary && source .env && python3 scripts/anonymize_content.py')


if __name__ == '__main__':
    main()
