import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Importar los handlers existentes compatibles con el wrapper
import authHandler from '../api/auth.js'
import epicrisisHandler from '../api/epicrisis.js'
import annotationsHandler from '../api/annotations.js'
import adminHandler from '../api/admin.js'
import lockHandler from '../api/lock.js'

import { db, epicrisis } from '../db/index.js'
import { eq } from 'drizzle-orm'
import fs from 'fs'

const app = express()

// Configurar CORS
const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  })
)

app.use(express.json())

// Servir PDFs dinámicamente desde base de datos con fallback a archivos
app.get('/uploads/:id', async (req, res) => {
  const { id } = req.params
  const patientId = id.replace('.pdf', '')

  try {
    const result = await db
      .select({ pdfData: epicrisis.pdfData })
      .from(epicrisis)
      .where(eq(epicrisis.patientId, patientId))
      .limit(1)

    if (result[0] && result[0].pdfData) {
      res.setHeader('Content-Type', 'application/pdf')
      return res.send(result[0].pdfData)
    }

    // Fallback: buscar en el sistema de archivos
    const filePath = path.join(process.cwd(), 'uploads', id)
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath)
    }

    return res.status(404).send('PDF no encontrado')
  } catch (err) {
    console.error('Error al obtener PDF:', err)
    return res.status(500).send('Error interno del servidor')
  }
})

// Adaptar Express req/res al contrato VercelRequest/VercelResponse
type Handler = (req: VercelRequest, res: VercelResponse) => unknown

function wrap(handler: Handler) {
  return (req: express.Request, res: express.Response) =>
    handler(req as unknown as VercelRequest, res as unknown as VercelResponse)
}

// Endpoints
app.all('/api/auth', wrap(authHandler))
app.all('/api/epicrisis', wrap(epicrisisHandler))
app.all('/api/annotations', wrap(annotationsHandler))
app.all('/api/admin', wrap(adminHandler))
app.all('/api/lock', wrap(lockHandler))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`[API] Servidor Express corriendo en: http://localhost:${PORT}`)
  console.log(`[Static] Carpeta de PDFs estáticos expuesta en: http://localhost:${PORT}/uploads`)
})
