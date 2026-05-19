import type { VercelRequest, VercelResponse } from '@vercel/node'

const BACKEND_URL = 'https://carmela-unadjacent-unpreventively.ngrok-free.dev'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).send('Missing id parameter')
  }
  if (id.includes('..') || id.includes('/') || id.includes('\\')) {
    return res.status(400).send('Invalid id')
  }

  try {
    const upstream = await fetch(`${BACKEND_URL}/uploads/${id}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
    if (!upstream.ok) {
      return res.status(upstream.status).send('PDF not found')
    }
    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', String(buffer.length))
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    return res.status(200).send(buffer)
  } catch {
    return res.status(502).send('Failed to fetch PDF from backend')
  }
}
