import type { LeadInput } from './validation'

export type SubmitResult =
  | { status: 'success' }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'rate_limited' }
  | { status: 'error' }

/** Читает UTM-метки из адресной строки */
export function readUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search)
  const out: Record<string, string> = {}
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = params.get(k)
    if (v) out[k] = v
  }
  return out
}

/**
 * Адрес приёма заявок. По умолчанию свой /api/lead (Vercel, dev-сервер).
 * Для GitHub Pages задаётся при сборке: VITE_LEAD_ENDPOINT=https://script.google.com/macros/s/.../exec
 */
export const LEAD_ENDPOINT: string = import.meta.env.VITE_LEAD_ENDPOINT || '/api/lead'

interface LeadResponse {
  ok?: boolean
  error?: string
  errors?: Record<string, string>
}

/** «Успех» возвращается только после положительного ответа сервера. */
export async function submitLead(
  input: LeadInput,
  fetchImpl: typeof fetch = fetch,
  endpoint: string = LEAD_ENDPOINT,
): Promise<SubmitResult> {
  const external = /^https?:\/\//i.test(endpoint)
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      // Внешний адрес (Apps Script) не умеет в CORS-preflight: text/plain его не вызывает
      headers: { 'Content-Type': external ? 'text/plain;charset=utf-8' : 'application/json' },
      body: JSON.stringify(input),
    })
    let data: LeadResponse | null = null
    try {
      data = await res.json()
    } catch {
      data = null
    }
    // Apps Script всегда отвечает 200 и кладёт результат в тело, поэтому смотрим на оба признака
    if (res.ok && data?.ok === true) return { status: 'success' }
    if (data?.errors && (res.status === 400 || data.error === 'validation')) {
      return { status: 'invalid', errors: data.errors }
    }
    if (res.status === 429 || data?.error === 'rate_limited') return { status: 'rate_limited' }
    return { status: 'error' }
  } catch {
    return { status: 'error' }
  }
}
