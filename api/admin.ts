import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, users, epicrisis } from './_lib/db.js'
import { getAuthUser } from './_lib/auth.js'

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const AssignSchema = z.object({
  epicrisisId: z.number().int().positive(),
  userId: z.number().int().positive().nullable(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const authUser = await getAuthUser(req)
  if (!authUser) return res.status(401).json({ error: 'No autenticado' })
  if (authUser.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' })

  // GET /api/admin?resource=users|epicrisis
  if (req.method === 'GET') {
    const resource = req.query.resource as string

    if (resource === 'users') {
      const annotators = await db
        .select({ id: users.id, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.role, 'annotator'))
      return res.status(200).json({ users: annotators })
    }

    if (resource === 'epicrisis' || !resource) {
      const rows = await db
        .select({
          id: epicrisis.id,
          status: epicrisis.status,
          assigneeId: epicrisis.assigneeId,
          createdAt: epicrisis.createdAt,
          assigneeEmail: users.email,
        })
        .from(epicrisis)
        .leftJoin(users, eq(epicrisis.assigneeId, users.id))
        .orderBy(epicrisis.id)

      // Stats summary
      const total = rows.length
      const byStatus = { pending: 0, in_review: 0, reviewed: 0 }
      const unassigned = rows.filter((r) => r.assigneeId === null).length
      rows.forEach((r) => byStatus[r.status]++)

      return res.status(200).json({
        epicrises: rows,
        stats: { total, unassigned, ...byStatus },
      })
    }

    return res.status(400).json({ error: 'resource debe ser users o epicrisis' })
  }

  // PATCH /api/admin — asignar/desasignar epicrisis
  if (req.method === 'PATCH') {
    const parsed = AssignSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido', details: parsed.error.flatten() })
    }

    const { epicrisisId, userId } = parsed.data

    const [doc] = await db
      .select({ id: epicrisis.id, status: epicrisis.status })
      .from(epicrisis)
      .where(eq(epicrisis.id, epicrisisId))
      .limit(1)

    if (!doc) return res.status(404).json({ error: 'Epicrisis no encontrada' })
    if (doc.status === 'reviewed') {
      return res.status(409).json({ error: 'No se puede reasignar una epicrisis ya revisada' })
    }

    await db
      .update(epicrisis)
      .set({ assigneeId: userId })
      .where(eq(epicrisis.id, epicrisisId))

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
