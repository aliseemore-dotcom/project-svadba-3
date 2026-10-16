import { describe, expect, it } from 'vitest'
import { normalizePhone, normalizeTelegram, validateLead } from '../lib/validation'

const base = {
  name: 'Анна',
  contactMethod: 'phone',
  contact: '+7 900 123-45-67',
  consentPrivacy: true,
  clientRequestId: 'req-1',
}

describe('validateLead', () => {
  it('принимает корректную заявку и нормализует телефон', () => {
    const r = validateLead(base)
    expect(r.ok).toBe(true)
    expect(r.value?.contact).toBe('+79001234567')
    expect(r.value?.weddingPlan).toBeNull()
  })

  it('требует имя, контакт и согласие', () => {
    const r = validateLead({ ...base, name: ' ', contact: '', consentPrivacy: false })
    expect(r.ok).toBe(false)
    expect(Object.keys(r.errors).sort()).toEqual(['consentPrivacy', 'contact', 'name'])
  })

  it('согласие только явное true, строка "true" не подходит', () => {
    expect(validateLead({ ...base, consentPrivacy: 'true' }).ok).toBe(false)
    expect(validateLead({ ...base, consentPrivacy: undefined }).ok).toBe(false)
  })

  it('проверяет формат телефона и Telegram', () => {
    expect(validateLead({ ...base, contact: '12345' }).errors.contact).toBeDefined()
    expect(validateLead({ ...base, contact: 'abc' }).errors.contact).toBeDefined()
    const tg = validateLead({ ...base, contactMethod: 'telegram', contact: 'https://t.me/anna_k' })
    expect(tg.ok).toBe(true)
    expect(tg.value?.contact).toBe('@anna_k')
    expect(validateLead({ ...base, contactMethod: 'telegram', contact: '@a b' }).ok).toBe(false)
  })

  it('необязательное поле принимает только известные варианты', () => {
    expect(validateLead({ ...base, weddingPlan: 'choosing_date' }).ok).toBe(true)
    expect(validateLead({ ...base, weddingPlan: '' }).ok).toBe(true)
    expect(validateLead({ ...base, weddingPlan: 'hack' }).errors.weddingPlan).toBeDefined()
  })

  it('очищает управляющие символы и ограничивает длину', () => {
    expect(validateLead({ ...base, name: 'А\u0000нна\n\n' }).value?.name).toBe('А нна')
    expect(validateLead({ ...base, name: 'я'.repeat(300) }).errors.name).toBeDefined()
  })

  it('маркетинговое согласие учитывается только если включено', () => {
    expect(validateLead({ ...base, consentMarketing: true }).value?.consentMarketing).toBe(false)
    expect(
      validateLead({ ...base, consentMarketing: true }, { marketingConsentEnabled: true }).value?.consentMarketing,
    ).toBe(true)
  })

  it('оставляет только известные UTM-метки', () => {
    const r = validateLead({ ...base, utm: { utm_source: 'ig', evil: 'x' } })
    expect(r.value?.utm).toEqual({ utm_source: 'ig' })
  })
})

describe('нормализация', () => {
  it('normalizePhone', () => {
    expect(normalizePhone('8 (900) 123-45-67')).toBe('+89001234567')
    expect(normalizePhone('+7abc')).toBeNull()
  })
  it('normalizeTelegram', () => {
    expect(normalizeTelegram('@maria')).toBe('@maria')
    expect(normalizeTelegram('ab')).toBeNull()
  })
})
