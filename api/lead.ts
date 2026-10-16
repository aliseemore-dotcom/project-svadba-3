import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleLeadRequest } from '../server/lead-handler'
import { buildSinksFromEnv } from '../server/providers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const fwd = req.headers['x-forwarded-for']
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
  const result = await handleLeadRequest(
    {
      method: req.method ?? 'GET',
      body: req.body,
      ip,
      origin: req.headers.origin,
      host: req.headers.host,
    },
    { sinks: buildSinksFromEnv(process.env), env: process.env },
  )
  res.setHeader('Cache-Control', 'no-store')
  res.status(result.status).json(result.body)
}
