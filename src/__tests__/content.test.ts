import { describe, expect, it } from 'vitest'
import { event } from '../content/event'
import { faq, getPublishedFaq } from '../content/faq'
import { sections } from '../content/sections'
import { getPublishedVendors, vendors } from '../content/vendors'
import { buildSinksFromEnv } from '../../server/providers'

describe('контент', () => {
  it('не содержит выдуманных подрядчиков и ответов FAQ', () => {
    expect(getPublishedVendors(vendors)).toHaveLength(0)
    expect(getPublishedFaq(faq)).toHaveLength(0)
  })

  it('неподтверждённые факты — null, а не догадки', () => {
    expect([event.city, event.venue, event.startTime, event.price, event.participation]).toEqual([
      null,
      null,
      null,
      null,
      null,
    ])
    expect(event.raffle.rulesApproved).toBe(false)
  })

  it('название по бренд-брифу и нет оплаты/«билета для двоих»', () => {
    const all = JSON.stringify(sections)
    expect(all).not.toContain('3.0')
    expect(all).toContain('Проект: Свадьба 3')
    expect(all.toLowerCase()).not.toContain('билет для двоих')
    expect(all.toLowerCase()).not.toContain('оплат')
  })

  it('рекламного согласия по умолчанию нет', () => {
    expect(event.legal.marketingConsentEnabled).toBe(false)
  })
})

describe('каналы доставки', () => {
  it('без переменных окружения каналов нет', () => {
    expect(buildSinksFromEnv({})).toHaveLength(0)
  })
  it('включаются по переменным', () => {
    const sinks = buildSinksFromEnv({ LEAD_WEBHOOK_URL: 'https://h.test', TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' })
    expect(sinks.map((s) => s.name)).toEqual(['webhook', 'telegram'])
  })
})
