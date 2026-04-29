import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db, annotations, epicrisis } from './_lib/db'
import { getAuthUser } from './_lib/auth'

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const CriterionSchema = z.object({
  criterionName: z.string().min(1),
  isPresent: z.boolean().nullable(),
  evidenceText: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
})

const SubmitSchema = z.object({
  epicrisisId: z.number().int().positive(),
  criteria: z.array(CriterionSchema).min(1),
  isFinal: z.boolean().default(false),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const authUser = await getAuthUser(req)
  if (!authUser) return res.status(401).json({ error: 'No autenticado' })

  const userId = Number(authUser.sub)

  if (req.method === 'GET') {
    const { epicrisisId } = req.query
    if (!epicrisisId) return res.status(400).json({ error: 'epicrisisId requerido' })

    const rows = await db
      .select()
      .from(annotations)
      .where(
        and(
          eq(annotations.epicrisisId, Number(epicrisisId)),
          eq(annotations.userId, userId)
        )
      )

    return res.status(200).json({ annotations: rows })
  }

  if (req.method === 'POST') {
    const parsed = SubmitSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido', details: parsed.error.flatten() })
    }

    const { epicrisisId, criteria, isFinal } = parsed.data

    const [doc] = await db
      .select()
      .from(epicrisis)
      .where(eq(epicrisis.id, epicrisisId))
      .limit(1)

    if (!doc) return res.status(404).json({ error: 'Epicrisis no encontrada' })

    const isOwner = doc.assigneeId === userId || authUser.role === 'admin'
    if (!isOwner) return res.status(403).json({ error: 'Sin permiso' })

    if (doc.status === 'reviewed' && authUser.role !== 'admin') {
      return res.status(409).json({ error: 'Esta epicrisis ya fue revisada' })
    }

    await db
      .delete(annotations)
      .where(
        and(
          eq(annotations.epicrisisId, epicrisisId),
          eq(annotations.userId, userId)
        )
      )

    const rows = criteria.map((c) => ({
      epicrisisId,
      userId,
      criterionName: c.criterionName,
      isPresent: c.isPresent,
      evidenceText: c.evidenceText ?? null,
      comments: c.comments ?? null,
      updatedAt: new Date(),
    }))

    await db.insert(annotations).values(rows)

    if (isFinal) {
      await db
        .update(epicrisis)
        .set({ status: 'reviewed' })
        .where(eq(epicrisis.id, epicrisisId))
    } else {
      if (doc.status === 'pending') {
        await db
          .update(epicrisis)
          .set({ status: 'in_review' })
          .where(eq(epicrisis.id, epicrisisId))
      }
    }

    return res.status(200).json({ ok: true, status: isFinal ? 'reviewed' : 'in_review' })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
