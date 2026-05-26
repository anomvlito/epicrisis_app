/**
 * Migration v3: per-user consistency fixes
 *
 * 1. epicrisis_assignments.completed_at  — track per-annotator completion
 * 2. epicrisis_clinical_data date fields — per-user dates (don't overwrite auto-extracted seed)
 * 3. annotations unique constraint        — safety net against duplicate rows
 */
import { sql } from 'drizzle-orm'
import { db } from './index.js'

async function run() {
  console.log('Running migration v3…')

  // 1. Per-annotator completion tracking
  await db.execute(sql`
    ALTER TABLE epicrisis_assignments
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
  `)
  console.log('  ✓ epicrisis_assignments.completed_at')

  // 2. Per-user date fields in clinical data
  await db.execute(sql`
    ALTER TABLE epicrisis_clinical_data
    ADD COLUMN IF NOT EXISTS fecha_ingreso_hosp TEXT,
    ADD COLUMN IF NOT EXISTS fecha_egreso_hosp  TEXT,
    ADD COLUMN IF NOT EXISTS fecha_ingreso_uci  TEXT,
    ADD COLUMN IF NOT EXISTS fecha_egreso_uci   TEXT,
    ADD COLUMN IF NOT EXISTS comentario_final   TEXT
  `)
  console.log('  ✓ epicrisis_clinical_data date columns')

  // 3. Unique constraint on annotations (safe to add since DELETE+INSERT is sequential)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'annotations_epicrisis_user_criterion_uniq'
      ) THEN
        ALTER TABLE annotations
        ADD CONSTRAINT annotations_epicrisis_user_criterion_uniq
        UNIQUE (epicrisis_id, user_id, criterion_name);
      END IF;
    END $$
  `)
  console.log('  ✓ annotations unique constraint')

  console.log('Migration v3 complete.')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
