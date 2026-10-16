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

/** «Успех» возвращается только после положительного ответа сервера. */
export async function submitLead(input: LeadInput, fetchImpl: typeof fetch = fetch): Promise<SubmitResult> {
  try {
    const res = await fetchImpl('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    let data: { ok?: boolean; errors?: Record<string, string> } | null = null
    try {
      data = await res.json()
    } catch {
      data = null
    }
    if (res.ok && data?.ok === true) return { status: 'success' }
    if (res.status === 400 && data?.errors) return { status: 'invalid', errors: data.errors }
    if (res.status === 429) return { status: 'rate_limited' }
    return { status: 'error' }
  } catch {
    return { status: 'error' }
  }
}
