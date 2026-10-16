// Валидация заявки. Один модуль и для формы, и для сервера.
import { form } from '../content/sections'

export type ContactMethod = 'phone' | 'telegram'
export type WeddingPlan = 'yes' | 'choosing_date' | 'other'

export interface LeadInput {
  name: string
  contactMethod: ContactMethod
  contact: string
  weddingPlan?: WeddingPlan | ''
  consentPrivacy: boolean
  consentMarketing?: boolean
  /** Ловушка для ботов: у людей всегда пусто */
  website?: string
  /** Идемпотентность: повторная отправка с тем же id не создаёт дубль */
  clientRequestId: string
  utm?: Record<string, string>
  pageUrl?: string
}

export type FieldErrors = Partial<Record<'name' | 'contact' | 'weddingPlan' | 'consentPrivacy', string>>

const NAME_MAX = 100
const WEDDING_PLANS: WeddingPlan[] = ['yes', 'choosing_date', 'other']
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim()
  if (!/^[+\d\s().-]+$/.test(trimmed)) return null
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return null
  return `+${digits}`
}

export function normalizeTelegram(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
    .replace(/^@/, '')
  return /^[A-Za-z0-9_]{5,32}$/.test(cleaned) ? `@${cleaned}` : null
}

export function sanitizeText(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  // убираем управляющие символы и схлопываем пробелы
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

export interface ValidationResult {
  ok: boolean
  errors: FieldErrors
  /** Очищенные данные (только при ok) */
  value?: Required<Pick<LeadInput, 'name' | 'contactMethod' | 'contact' | 'consentPrivacy' | 'clientRequestId'>> & {
    weddingPlan: WeddingPlan | null
    consentMarketing: boolean
    website: string
    utm: Record<string, string>
    pageUrl: string | null
  }
}

export function validateLead(input: unknown, opts: { marketingConsentEnabled?: boolean } = {}): ValidationResult {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const errors: FieldErrors = {}

  const name = sanitizeText(raw.name, NAME_MAX + 1)
  if (!name) errors.name = form.errors.nameRequired
  else if (name.length > NAME_MAX) errors.name = form.errors.nameTooLong

  const contactMethod: ContactMethod = raw.contactMethod === 'telegram' ? 'telegram' : 'phone'
  const rawContact = typeof raw.contact === 'string' ? raw.contact : ''
  let contact = ''
  if (!rawContact.trim()) {
    errors.contact = form.errors.contactRequired
  } else if (contactMethod === 'phone') {
    const p = normalizePhone(rawContact)
    if (p) contact = p
    else errors.contact = form.errors.phoneInvalid
  } else {
    const t = normalizeTelegram(rawContact)
    if (t) contact = t
    else errors.contact = form.errors.telegramInvalid
  }

  let weddingPlan: WeddingPlan | null = null
  if (raw.weddingPlan !== undefined && raw.weddingPlan !== '' && raw.weddingPlan !== null) {
    if (WEDDING_PLANS.includes(raw.weddingPlan as WeddingPlan)) weddingPlan = raw.weddingPlan as WeddingPlan
    else errors.weddingPlan = form.errors.weddingPlanInvalid
  }

  // согласие — только явное true, без предварительной отметки
  if (raw.consentPrivacy !== true) errors.consentPrivacy = form.errors.consentRequired

  const clientRequestId = sanitizeText(raw.clientRequestId, 64)

  const utm: Record<string, string> = {}
  if (raw.utm && typeof raw.utm === 'object') {
    for (const k of UTM_KEYS) {
      const v = sanitizeText((raw.utm as Record<string, unknown>)[k], 200)
      if (v) utm[k] = v
    }
  }

  const ok = Object.keys(errors).length === 0
  if (!ok) return { ok, errors }
  return {
    ok,
    errors,
    value: {
      name,
      contactMethod,
      contact,
      weddingPlan,
      consentPrivacy: true,
      consentMarketing: !!opts.marketingConsentEnabled && raw.consentMarketing === true,
      website: sanitizeText(raw.website, 200),
      clientRequestId,
      utm,
      pageUrl: sanitizeText(raw.pageUrl, 300) || null,
    },
  }
}
