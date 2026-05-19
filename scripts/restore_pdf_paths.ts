import 'dotenv/config'
import pkg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pkg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.dirname(__dirname)
const UPLOADS = path.join(ROOT, 'uploads')

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const { rows } = await pool.query<{ id: number; patient_id: string; pdf_path: string | null }>(
    `SELECT id, patient_id, pdf_path FROM epicrisis ORDER BY id`
  )

  let updated = 0
  let skipped = 0
  let missing = 0

  for (const row of rows) {
    const filename = `${row.patient_id}.pdf`
    const filePath = path.join(UPLOADS, filename)

    if (!fs.existsSync(filePath)) {
      console.log(`[MISS]  id=${row.id} patient_id=${row.patient_id} — archivo no encontrado`)
      missing++
      continue
    }

    if (row.pdf_path === filename) {
      skipped++
      continue
    }

    const pdfData = fs.readFileSync(filePath)
    await pool.query(
      `UPDATE epicrisis SET pdf_path = $1, pdf_data = $2 WHERE id = $3`,
      [filename, pdfData, row.id]
    )
    console.log(`[OK]    id=${row.id} → pdf_path=${filename}`)
    updated++
  }

  console.log(`\nListo: ${updated} actualizados, ${skipped} ya tenían pdf_path, ${missing} sin archivo.`)
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
