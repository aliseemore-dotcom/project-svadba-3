import { randomUUID } from 'node:crypto'
import { event } from '../src/content/event'
import { validateLead } from '../src/lib/validation'
import type { DeliveryStatus, Lead, LeadSink } from './types'

export interface LeadRequest {
  method: string
  body: unknown
  ip: string
  origin?: string
  host?: string
}

export interface LeadResponse {
  status: number
  body: Record<string, unknown>
}

/** Память процесса: лимит частоты и идемпотентность. В serverless это best-effort (см. README). */
export interface LeadState {
  hits: Map<string, number[]>
  requests: Map<string, Promise<LeadResponse>>
}

export const createLeadState = (): LeadState => ({ hits: new Map(), requests: new Map() })
const defaultState = createLeadState()

export interface LeadContext {
  sinks: LeadSink[]
  env?: Record<string, string | undefined>
  state?: LeadState
  now?: () => number
  deliveryTimeoutMs?: number
}

const json = (status: number, body: Record<string, unknown>): LeadResponse => ({ status, body })

function rateLimited(state: LeadState, ip: string, now: number, max: number, windowMs: number): boolean {
  const recent = (state.hits.get(ip) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    state.hits.set(ip, recent)
    return true
  }
  recent.push(now)
  state.hits.set(ip, recent)
  return false
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    )
  })
}

export async function handleLeadRequest(req: LeadRequest, ctx: LeadContext): Promise<LeadResponse> {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' })

  // Заявки принимаем только со страниц этого же сайта
  if (req.origin && req.host) {
    let originHost = ''
    try {
      originHost = new URL(req.origin).host
    } catch {
      originHost = ''
    }
    if (originHost !== req.host) return json(403, { ok: false, error: 'forbidden' })
  }

  if (!req.body || typeof req.body !== 'object') return json(400, { ok: false, error: 'bad_request', errors: {} })

  // Ловушка для ботов: притворяемся, что приняли, но ничего не доставляем
  if (typeof (req.body as { website?: unknown }).website === 'string' && (req.body as { website: string }).website.trim()) {
    return json(200, { ok: true })
  }

  const env = ctx.env ?? {}
  const state = ctx.state ?? defaultState
  const now = (ctx.now ?? Date.now)()
  const max = Number(env.LEAD_RATE_LIMIT_MAX) || 5
  const windowMs = (Number(env.LEAD_RATE_LIMIT_WINDOW_SEC) || 600) * 1000
  if (rateLimited(state, req.ip, now, max, windowMs)) return json(429, { ok: false, error: 'rate_limited' })

  const checked = validateLead(req.body, { marketingConsentEnabled: event.legal.marketingConsentEnabled })
  if (!checked.ok || !checked.value) return json(400, { ok: false, error: 'validation', errors: checked.errors })
  const v = checked.value

  // Пока канал доставки не подключён, «отправлено» не показываем
  if (ctx.sinks.length === 0) return json(503, { ok: false, error: 'not_configured' })

  // Повторная отправка с тем же id не создаёт дубль
  const key = v.clientRequestId
  if (key) {
    const existing = state.requests.get(key)
    if (existing) return existing
  }

  const job = (async (): Promise<LeadResponse> => {
    const createdAt = new Date(now).toISOString()
    const lead: Lead = {
      id: randomUUID(),
      createdAt,
      name: v.name,
      contactMethod: v.contactMethod,
      contact: v.contact,
      weddingPlan: v.weddingPlan,
      consent: {
        privacy: true,
        privacyPolicyVersion: event.legal.privacyPolicyVersion,
        marketing: v.consentMarketing,
        at: createdAt,
      },
      source: { utm: v.utm, pageUrl: v.pageUrl },
      event: event.name,
    }

    const timeout = ctx.deliveryTimeoutMs ?? 8000
    const results = await Promise.allSettled(ctx.sinks.map((s) => withTimeout(s.deliver(lead), timeout)))
    const delivery: Record<string, DeliveryStatus> = {}
    results.forEach((r, i) => {
      delivery[ctx.sinks[i].name] = r.status === 'fulfilled' ? 'delivered' : 'failed'
    })
    // В лог идут только статусы, без персональных данных
    console.info(JSON.stringify({ type: 'lead', id: lead.id, createdAt, delivery }))

    if (results.some((r) => r.status === 'fulfilled')) return json(200, { ok: true })
    return json(502, { ok: false, error: 'delivery_failed' })
  })()

  if (key) {
    state.requests.set(key, job)
    // при неуспехе освобождаем id, чтобы повтор мог пройти
    job.then((r) => {
      if (r.status !== 200) state.requests.delete(key)
    })
  }
  return job
}
