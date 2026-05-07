import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function migrate() {
  console.log('Añadiendo columna clinical_data a epicrisis…')
  try {
    await sql`ALTER TABLE epicrisis ADD COLUMN IF NOT EXISTS clinical_data JSONB`
    console.log('✓ Columna clinical_data añadida.')
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  }
}
migrate()
