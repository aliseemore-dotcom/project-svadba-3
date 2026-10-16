import { describe, expect, it, vi } from 'vitest'
import { createLeadState, handleLeadRequest } from '../lead-handler'
import type { Lead, LeadSink } from '../types'

const body = (over: Record<string, unknown> = {}) => ({
  name: 'Анна',
  contactMethod: 'phone',
  contact: '+79001234567',
  consentPrivacy: true,
  clientRequestId: 'req-1',
  ...over,
})
const req = (b: unknown, over = {}) => ({ method: 'POST', body: b, ip: '1.1.1.1', ...over })
const okSink = (): LeadSink & { calls: Lead[] } => {
  const calls: Lead[] = []
  return { name: 'ok', calls, deliver: async (l) => void calls.push(l) }
}
const badSink: LeadSink = { name: 'bad', deliver: async () => Promise.reject(new Error('down')) }

vi.spyOn(console, 'info').mockImplementation(() => {})

describe('handleLeadRequest', () => {
  it('405 не для POST', async () => {
    const r = await handleLeadRequest(req(body(), { method: 'GET' }), { sinks: [okSink()], state: createLeadState() })
    expect(r.status).toBe(405)
  })

  it('503 пока канал доставки не подключён: ложного успеха нет', async () => {
    const r = await handleLeadRequest(req(body()), { sinks: [], state: createLeadState() })
    expect(r.status).toBe(503)
    expect(r.body.ok).toBe(false)
  })

  it('400 без обязательных полей и согласия', async () => {
    const sink = okSink()
    const r = await handleLeadRequest(req(body({ name: '', consentPrivacy: false })), {
      sinks: [sink],
      state: createLeadState(),
    })
    expect(r.status).toBe(400)
    expect(sink.calls).toHaveLength(0)
  })

  it('200 и доставка с согласием, версией политики и UTM', async () => {
    const sink = okSink()
    const r = await handleLeadRequest(req(body({ utm: { utm_source: 'ig' }, pageUrl: 'https://x.test/' })), {
      sinks: [sink],
      state: createLeadState(),
    })
    expect(r.status).toBe(200)
    expect(sink.calls).toHaveLength(1)
    const lead = sink.calls[0]
    expect(lead.createdAt).toMatch(/^\d{4}-/)
    expect(lead.consent.privacy).toBe(true)
    expect(lead.consent.privacyPolicyVersion).toBeTruthy()
    expect(lead.source.utm).toEqual({ utm_source: 'ig' })
    expect(lead.source.pageUrl).toBe('https://x.test/')
  })

  it('повтор с тем же clientRequestId не создаёт дубль', async () => {
    const sink = okSink()
    const ctx = { sinks: [sink], state: createLeadState() }
    const [a, b] = await Promise.all([handleLeadRequest(req(body()), ctx), handleLeadRequest(req(body()), ctx)])
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(sink.calls).toHaveLength(1)
  })

  it('502, если все каналы упали; повтор потом проходит', async () => {
    const state = createLeadState()
    const fail = await handleLeadRequest(req(body()), { sinks: [badSink], state })
    expect(fail.status).toBe(502)
    await Promise.resolve()
    const sink = okSink()
    const retry = await handleLeadRequest(req(body()), { sinks: [sink], state })
    expect(retry.status).toBe(200)
    expect(sink.calls).toHaveLength(1)
  })

  it('успех, если сработал хотя бы один канал', async () => {
    const r = await handleLeadRequest(req(body()), { sinks: [badSink, okSink()], state: createLeadState() })
    expect(r.status).toBe(200)
  })

  it('ловушка для ботов: ответ 200, но доставки нет', async () => {
    const sink = okSink()
    const r = await handleLeadRequest(req(body({ website: 'http://spam' })), { sinks: [sink], state: createLeadState() })
    expect(r.status).toBe(200)
    expect(sink.calls).toHaveLength(0)
  })

  it('429 при превышении лимита частоты', async () => {
    const state = createLeadState()
    const ctx = { sinks: [okSink()], state, env: { LEAD_RATE_LIMIT_MAX: '2' } }
    const statuses: number[] = []
    for (let i = 0; i < 3; i++) {
      statuses.push((await handleLeadRequest(req(body({ clientRequestId: `r${i}` })), ctx)).status)
    }
    expect(statuses).toEqual([200, 200, 429])
  })

  it('403 с чужого origin', async () => {
    const r = await handleLeadRequest(req(body(), { origin: 'https://evil.test', host: 'site.test' }), {
      sinks: [okSink()],
      state: createLeadState(),
    })
    expect(r.status).toBe(403)
  })

  it('таймаут канала считается неуспехом', async () => {
    const slow: LeadSink = { name: 'slow', deliver: () => new Promise(() => {}) }
    const r = await handleLeadRequest(req(body()), { sinks: [slow], state: createLeadState(), deliveryTimeoutMs: 20 })
    expect(r.status).toBe(502)
  })
})
