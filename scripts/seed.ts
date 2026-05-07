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
  
  console.log('Reading seed_data.json...')
  const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_data.json'), 'utf-8'))

  console.log('Cleaning old data (TRUNCATE epicrisis CASCADE)...')
  try {
    await pool.query('TRUNCATE TABLE epicrisis CASCADE')
    
    console.log(`Inserting ${jsonData.length} epicrisis...`)
    
    for (const item of jsonData) {
      await pool.query(
        `INSERT INTO epicrisis (
          patient_id, direccion, quintil_estimado, prevision, tipo_prevision,
          quintil_teorico, concordancia_gse, hacinamiento_manzana, confianza_geocodificacion,
          estado_mortalidad, fecha_ingreso_hosp, fecha_egreso_hosp, fecha_ingreso_uci,
          fecha_egreso_uci, comentario_final, content_markdown, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          item.patientId, item.direccion, item.quintilEstimado, item.prevision, item.tipoPrevision,
          item.quintilTeorico, item.concordanciaGse, item.hacinamientoManzana, item.confianzaGeocodificacion,
          item.estadoMortalidad, item.fechaIngresoHosp, item.fechaEgresoHosp, item.fechaIngresoUci,
          item.fechaEgresoUci, item.comentarioFinal, item.contentMarkdown, 'pending'
        ]
      )
    }
    
    console.log('✓ Seed complete: 275 records with dates and comments support.')
  } catch (e) {
    console.error('Error during seed:', e)
  } finally {
    await pool.end()
  }
}

main()
