import type { LeadSink } from '../types'

export function webhookSink(url: string, secret?: string, fetchImpl: typeof fetch = fetch): LeadSink {
  return {
    name: 'webhook',
    async deliver(lead) {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'X-Webhook-Secret': secret } : {}),
        },
        body: JSON.stringify(lead),
      })
      if (!res.ok) throw new Error(`webhook responded ${res.status}`)
    },
  }
}
