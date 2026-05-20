#!/usr/bin/env python3
"""
Mejora la anonimización de secciones ya almacenadas en la base de datos.

Problemas que resuelve:
  1. Apellidos expuestos tras anonimización parcial del pipeline antiguo:
       "[PERSONAL ANONIMIZADO] Salazar"  →  "[ANONIMIZADO]"
       "[PERSONAL ANONIMIZADO]-Esquide"  →  "[ANONIMIZADO]"
  2. Normaliza placeholder antiguo restante:
       "[PERSONAL ANONIMIZADO]"  →  "[ANONIMIZADO]"
  3. Líneas tipo "Bec. NombreCompleto" (becados/residentes):
       "Bec. María Salazar"  →  "[ANONIMIZADO]"
  4. Nombres de médicos en línea sola con preposiciones o iniciales:
       "Simon De La Maza Fontecilla"  →  "[ANONIMIZADO]"
       "Maria L. Lisbona Torres"      →  "[ANONIMIZADO]"
       "Juan Carlos Claro Garcia-Atance" →  "[ANONIMIZADO]"

Uso:
  python3 scripts/fix_anonymization.py
  python3 scripts/fix_anonymization.py --db postgresql://user@host/db
  python3 scripts/fix_anonymization.py --dry-run
"""

import argparse
import re
import psycopg2

DEFAULT_DB = 'postgresql://fabianortega@localhost:5432/epicrisis_dev'

# ── Patrones ───────────────────────────────────────────────────────────────────

# Token de nombre: palabra capitalizada (con guión), inicial (L.) o preposición (De, La…)
# _NAME_PREP solo acepta mayúscula inicial para evitar que "de"/"la" del texto clínico hagan match
_NAME_CAP   = r'[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:-[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?'
_NAME_INIT  = r'[A-ZÁÉÍÓÚÑ]\.'
_NAME_PREP  = r'(?:D(?:el?|i)|La|Los|Van|Von|El)'
_NAME_TOKEN = rf'(?:{_NAME_CAP}|{_NAME_INIT}|{_NAME_PREP})'

# Apellidos que quedaron visibles después de una anonimización parcial
# Nota: usa [ \t-] en lugar de [\s-] para NO cruzar líneas
PARTIAL_ANON_RE = re.compile(
    r'\[(?:PERSONAL )?ANONIMIZADO\](?:[ \t-]+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+',
)

# Líneas de becados: "Bec. NombreCompleto" o "Bec. [ANONIMIZADO] Apellido"
BECADO_RE = re.compile(
    rf'^Bec\.\s+(?:\[(?:PERSONAL )?ANONIMIZADO\]\s+)?{_NAME_TOKEN}(?:\s+{_NAME_TOKEN})*\s*$',
    re.MULTILINE,
)

# Línea solo con nombre de persona (≥3 tokens para evitar falsos positivos)
LONE_NAME_RE = re.compile(
    rf'^\s*{_NAME_TOKEN}(?:\s+{_NAME_TOKEN}){{2,}}\s*$',
    re.MULTILINE,
)

# Términos que indican que la línea NO es un nombre de persona
MEDICAL_RE = re.compile(
    r'(?:Resumen|Antecedentes|Diagnóstico|Evolución|Procedimientos?|'
    r'Anamnesis|Laboratorio|Ingreso|Egreso|Indicaciones?|Controles?|'
    r'Régimen|Alimentario|Medicamentos?|Reposo|Hospitalización|'
    r'Intervenciones?|Quirúrgicas?|Epidemiología|Comorbilidades?|'
    r'Paciente|Fallecido|Alta|Traslado|Urgencia|INTERNO|STAFF|'
    r'Hospital|Clínica|Servicio|Unidad|Departamento|Instituto)',
    re.IGNORECASE,
)


def fix_content(text: str) -> str:
    # 1. Apellidos expuestos: "[PERSONAL ANONIMIZADO] Salazar" → "[ANONIMIZADO]"
    text = PARTIAL_ANON_RE.sub('[ANONIMIZADO]', text)

    # 2. Normalizar placeholder antiguo restante
    text = text.replace('[PERSONAL ANONIMIZADO]', '[ANONIMIZADO]')

    # 3. Líneas de becados con nombre visible
    text = BECADO_RE.sub('[ANONIMIZADO]', text)

    # 4. Nombres solitarios en línea (médicos, residentes firmantes)
    def _remove_lone(m):
        line = m.group(0).strip()
        return m.group(0) if MEDICAL_RE.search(line) else '[ANONIMIZADO]'
    text = LONE_NAME_RE.sub(_remove_lone, text)

    return text


def main():
    parser = argparse.ArgumentParser(description='Mejora anonimización de secciones en DB')
    parser.add_argument('--db', default=DEFAULT_DB)
    parser.add_argument('--dry-run', action='store_true', help='Solo reporta, no modifica')
    args = parser.parse_args()

    conn = psycopg2.connect(args.db)
    cur  = conn.cursor()

    cur.execute('SELECT epicrisis_id, section_name, content FROM epicrisis_sections')
    rows = cur.fetchall()
    print(f'{len(rows)} secciones a revisar\n')

    if args.dry_run:
        print('(modo dry-run: no se modificará nada)\n')

    updated = 0
    shown   = 0
    for epicrisis_id, section_name, content in rows:
        fixed = fix_content(content)
        if fixed == content:
            continue
        updated += 1
        if shown < 15:
            shown += 1
            orig_lines = content.splitlines()
            new_lines  = fixed.splitlines()
            removed = [l for l in orig_lines if l not in new_lines]
            added   = [l for l in new_lines  if l not in orig_lines]
            print(f'  id={epicrisis_id} [{section_name}]')
            for r in removed[:2]:
                print(f'    - {r.strip()!r}')
            for a in added[:2]:
                print(f'    + {a.strip()!r}')
        if not args.dry_run:
            cur.execute(
                'UPDATE epicrisis_sections SET content = %s '
                'WHERE epicrisis_id = %s AND section_name = %s',
                (fixed, epicrisis_id, section_name),
            )

    if not args.dry_run:
        conn.commit()

    cur.close()
    conn.close()
    print(f'\n✓ Secciones {"que se actualizarían" if args.dry_run else "actualizadas"}: {updated} / {len(rows)}')


if __name__ == '__main__':
    main()
