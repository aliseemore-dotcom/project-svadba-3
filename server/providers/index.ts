import type { LeadSink } from '../types'
import { telegramSink } from './telegram'
import { webhookSink } from './webhook'

/** Каналы доставки включаются переменными окружения. Секреты остаются на сервере. */
export function buildSinksFromEnv(env: Record<string, string | undefined>): LeadSink[] {
  const sinks: LeadSink[] = []
  if (env.LEAD_WEBHOOK_URL) sinks.push(webhookSink(env.LEAD_WEBHOOK_URL, env.LEAD_WEBHOOK_SECRET))
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    sinks.push(telegramSink(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID))
  }
  return sinks
}
