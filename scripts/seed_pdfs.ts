import 'dotenv/config'
import pkg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pkg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set')

  const pool = new Pool({ connectionString })
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_data_pdfs.json'), 'utf-8'))

  console.log('Limpiando registros anteriores...')
  await pool.query('TRUNCATE TABLE epicrisis CASCADE')

  console.log(`Insertando ${data.length} epicrisis con PDF...`)
  for (const item of data) {
    await pool.query(
      `INSERT INTO epicrisis (
        patient_id, pdf_path, content_markdown,
        direccion, quintil_estimado, prevision, tipo_prevision,
        quintil_teorico, concordancia_gse, hacinamiento_manzana,
        confianza_geocodificacion, estado_mortalidad,
        fecha_ingreso_hosp, fecha_egreso_hosp,
        fecha_ingreso_uci, fecha_egreso_uci,
        comentario_final, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending')`,
      [
        item.patientId, item.pdfPath, item.contentMarkdown || '',
        item.direccion, item.quintilEstimado, item.prevision, item.tipoPrevision,
        item.quintilTeorico, item.concordanciaGse, item.hacinamientoManzana,
        item.confianzaGeocodificacion, item.estadoMortalidad,
        item.fechaIngresoHosp, item.fechaEgresoHosp,
        item.fechaIngresoUci, item.fechaEgresoUci,
        item.comentarioFinal,
      ]
    )
  }

  console.log(`✓ Seed completo: ${data.length} registros con PDF vinculado.`)
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
