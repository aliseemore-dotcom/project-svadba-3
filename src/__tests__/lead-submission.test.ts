import { describe, expect, it, vi } from 'vitest'
import { submitLead } from '../lib/lead-submission'
import type { LeadInput } from '../lib/validation'

const input: LeadInput = {
  name: 'Анна',
  contactMethod: 'phone',
  contact: '+79001234567',
  consentPrivacy: true,
  clientRequestId: 'r1',
}
const reply = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('submitLead', () => {
  it('успех только при ok: true и коде 200', async () => {
    expect(await submitLead(input, reply(200, { ok: true }))).toEqual({ status: 'success' })
    expect((await submitLead(input, reply(200, { ok: false, error: 'server_error' }))).status).toBe('error')
    expect((await submitLead(input, reply(200, {}))).status).toBe('error')
    expect((await submitLead(input, reply(503, { ok: false }))).status).toBe('error')
  })

  it('сетевая ошибка не считается успехом', async () => {
    const f = vi.fn(async () => Promise.reject(new Error('offline'))) as unknown as typeof fetch
    expect((await submitLead(input, f)).status).toBe('error')
  })

  it('понимает ответы Apps Script (всегда 200, ошибка в теле)', async () => {
    const errors = { name: 'Укажите имя' }
    expect(await submitLead(input, reply(200, { ok: false, error: 'validation', errors }))).toEqual({
      status: 'invalid',
      errors,
    })
    expect((await submitLead(input, reply(200, { ok: false, error: 'rate_limited' }))).status).toBe('rate_limited')
  })

  it('внешний адрес получает text/plain без preflight, свой /api/lead — JSON', async () => {
    const f = reply(200, { ok: true })
    await submitLead(input, f, 'https://script.google.com/macros/s/x/exec')
    await submitLead(input, f, '/api/lead')
    const calls = (f as unknown as ReturnType<typeof vi.fn>).mock.calls
    expect(calls[0][1].headers['Content-Type']).toContain('text/plain')
    expect(calls[1][1].headers['Content-Type']).toBe('application/json')
  })
})
