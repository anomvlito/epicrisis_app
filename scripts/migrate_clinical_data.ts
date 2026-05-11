import 'dotenv/config'
import pkg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { epicrisis, epicrisisClinicalData } from '../db/schema.js'
import { eq } from 'drizzle-orm'

const { Pool } = pkg

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set')

  const pool = new Pool({ connectionString })
  const db = drizzle(pool)

  console.log('Fetching epicrisis records...')
  const records = await db.select({ id: epicrisis.id, clinicalData: epicrisis.clinicalData }).from(epicrisis)
  console.log(`Found ${records.length} records.`)

  let migratedCount = 0
  const withData = records.filter(r => r.clinicalData !== null)
  console.log(`Records with clinicalData: ${withData.length}`)

  for (const record of records) {
    if (record.clinicalData) {
      console.log(`Migrating clinical data for epicrisis ID: ${record.id}`)
      
      // Ensure we don't duplicate if run twice (idempotent)
      const existing = await db
        .select()
        .from(epicrisisClinicalData)
        .where(eq(epicrisisClinicalData.epicrisisId, record.id))
        .limit(1)

      if (existing.length > 0) {
        console.log(`Record for epicrisis ID ${record.id} already exists in new table. Skipping.`)
        continue
      }

      try {
        await db.insert(epicrisisClinicalData).values({
          epicrisisId: record.id,
          ...(record.clinicalData as any), // Cast to any to avoid strict type issues if they diverge slightly
        })
        migratedCount++
      } catch (error) {
        console.error(`Error migrating record ${record.id}:`, error)
      }
    }
  }

  console.log(`✓ Migration complete. Migrated ${migratedCount} records.`)
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
