import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

const FIRMA_RE =
  /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:[^\S\n]+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}){1,3})(\s*\n\s*\d{1,2}[-/]\d{1,2}[-/]\d{4}[^\S\n]+\d{1,2}:\d{2}(?::\d{2})?)/gm

const CONTACTO_RE =
  /(?:contacto\s+)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})+)/gi

const FAMILIAR_RE =
  /(?:hija?|hijo|esposa?|marido|cónyuge|pareja|hermana?|hermano|madre|padre)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})+)/gi

const MEDICAL = new Set([
  'Anamnesis','Antecedentes','Diagnósticos','Diagnóstico','Evolución',
  'Resumen','Procedimientos','Laboratorio','Ingreso','Egreso',
  'Crisis','Shock','Sepsis','Manejo','Renal','Pulmonar','Hepático',
  'Cardíaco','Cerebral','Vascular','Remota','Próxima','Mórbidos',
])

function isMedical(name: string) {
  return [...MEDICAL].some(t => name.includes(t))
}

function clean(text: string): { cleaned: string; count: number } {
  let count = 0

  const withoutFirmas = text.replace(FIRMA_RE, (match, name, rest) => {
    if (isMedical(name)) return match
    count++
    return `[FIRMA MÉDICO ANONIMIZADA]${rest}`
  })

  const withoutContactos = withoutFirmas.replace(CONTACTO_RE, (match, name) => {
    if (isMedical(name)) return match
    count++
    return match.replace(name, '[ANONIMIZADO]')
  })

  const withoutFamiliares = withoutContactos.replace(FAMILIAR_RE, (match, name) => {
    if (isMedical(name)) return match
    count++
    return match.replace(name, '[ANONIMIZADO]')
  })

  return { cleaned: withoutFamiliares, count }
}

async function main() {
  console.log('Leyendo registros desde Neon…')
  const rows = await sql`SELECT id, content_markdown FROM epicrisis`
  console.log(`Total registros: ${rows.length}`)

  let updated = 0
  let totalChanges = 0

  for (const row of rows) {
    const { cleaned, count } = clean(row.content_markdown ?? '')
    if (count > 0) {
      await sql`UPDATE epicrisis SET content_markdown = ${cleaned} WHERE id = ${row.id}`
      updated++
      totalChanges += count
      process.stdout.write(`\r  Actualizados: ${updated} registros, ${totalChanges} ocurrencias…`)
    }
  }

  console.log(`\n✓ Listo. ${updated} registros actualizados, ${totalChanges} ocurrencias de PII eliminadas.`)
}

main().catch(e => { console.error(e); process.exit(1) })
