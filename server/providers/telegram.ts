import type { Lead, LeadSink } from '../types'

const PLAN: Record<string, string> = {
  yes: 'Да',
  choosing_date: 'Пока выбираем дату',
  other: 'Другое',
}

export function formatLeadMessage(lead: Lead): string {
  const lines = [
    `Новая заявка: ${lead.event}`,
    `Имя: ${lead.name}`,
    `${lead.contactMethod === 'phone' ? 'Телефон' : 'Telegram'}: ${lead.contact}`,
    `Свадьба в 2027: ${lead.weddingPlan ? PLAN[lead.weddingPlan] : 'не указано'}`,
    `Согласие на обработку данных: да (политика ${lead.consent.privacyPolicyVersion})`,
    `Получено: ${lead.createdAt}`,
  ]
  const utm = Object.entries(lead.source.utm)
  if (utm.length) lines.push(`UTM: ${utm.map(([k, v]) => `${k}=${v}`).join(', ')}`)
  return lines.join('\n')
}

export function telegramSink(token: string, chatId: string, fetchImpl: typeof fetch = fetch): LeadSink {
  return {
    name: 'telegram',
    async deliver(lead) {
      // Без parse_mode: пользовательский текст не интерпретируется как разметка
      const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: formatLeadMessage(lead) }),
      })
      if (!res.ok) throw new Error(`telegram responded ${res.status}`)
    },
  }
}
