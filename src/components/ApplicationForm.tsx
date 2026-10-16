import { useRef, useState, type FormEvent } from 'react'
import { event } from '../content/event'
import { CTA, form as copy } from '../content/sections'
import { track } from '../lib/analytics'
import { readUtm, submitLead, type SubmitResult } from '../lib/lead-submission'
import { validateLead, type ContactMethod, type FieldErrors, type LeadInput } from '../lib/validation'

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rate_limited'

const newRequestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

interface Props {
  /** Для тестов: подмена отправки */
  submit?: (input: LeadInput) => Promise<SubmitResult>
}

export function ApplicationForm({ submit = submitLead }: Props) {
  const [name, setName] = useState('')
  const [method, setMethod] = useState<ContactMethod>('phone')
  const [contact, setContact] = useState('')
  const [weddingPlan, setWeddingPlan] = useState('')
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const requestId = useRef(newRequestId())
  const started = useRef(false)
  const inFlight = useRef(false)

  const markStarted = () => {
    if (started.current) return
    started.current = true
    track('application_start')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (inFlight.current) return // защита от двойной отправки

    const input: LeadInput = {
      name,
      contactMethod: method,
      contact,
      weddingPlan: weddingPlan as LeadInput['weddingPlan'],
      consentPrivacy,
      consentMarketing: event.legal.marketingConsentEnabled ? consentMarketing : false,
      website,
      clientRequestId: requestId.current,
      utm: readUtm(window.location.search),
      pageUrl: window.location.origin + window.location.pathname,
    }

    const checked = validateLead(input, { marketingConsentEnabled: event.legal.marketingConsentEnabled })
    setErrors(checked.errors)
    if (!checked.ok) {
      setStatus('idle')
      // фокус на первом поле с ошибкой
      const first = (['name', 'contact', 'weddingPlan', 'consentPrivacy'] as const).find((k) => checked.errors[k])
      if (first) document.getElementById(`field-${first}`)?.focus()
      return
    }

    inFlight.current = true
    setStatus('submitting')
    const result = await submit(input)
    inFlight.current = false

    if (result.status === 'success') {
      track('application_submit_success')
      requestId.current = newRequestId()
      setStatus('success')
      return
    }
    track('application_submit_error', { reason: result.status })
    if (result.status === 'invalid') {
      setErrors(result.errors as FieldErrors)
      setStatus('idle')
    } else {
      // введённые данные сохраняются; id запроса прежний, чтобы повтор не создал дубль
      setStatus(result.status === 'rate_limited' ? 'rate_limited' : 'error')
    }
  }

  if (status === 'success') {
    return (
      <div className="form form--done" role="status" aria-live="polite">
        <p className="lead-italic">{copy.success}</p>
      </div>
    )
  }

  const busy = status === 'submitting'
  const err = (k: keyof FieldErrors) =>
    errors[k] ? (
      <p className="field__error" id={`error-${k}`}>
        {errors[k]}
      </p>
    ) : null
  const describe = (k: keyof FieldErrors) => (errors[k] ? `error-${k}` : undefined)
  const contactCopy = method === 'phone' ? copy.fields.contactPhone : copy.fields.contactTelegram

  return (
    <form className="form" onSubmit={onSubmit} noValidate onFocus={markStarted} aria-busy={busy}>
      <div className="field">
        <label htmlFor="field-name">{copy.fields.name.label}</label>
        <input
          id="field-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder={copy.fields.name.placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={describe('name')}
        />
        {err('name')}
      </div>

      <fieldset className="field field--methods">
        <legend>{copy.fields.contactMethod.label}</legend>
        {(['phone', 'telegram'] as const).map((m) => (
          <label key={m} className="radio">
            <input
              type="radio"
              name="contactMethod"
              value={m}
              checked={method === m}
              onChange={() => {
                setMethod(m)
                setErrors((prev) => ({ ...prev, contact: undefined }))
              }}
            />
            <span>{copy.fields.contactMethod[m]}</span>
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="field-contact">{contactCopy.label}</label>
        <input
          id="field-contact"
          name="contact"
          type={method === 'phone' ? 'tel' : 'text'}
          autoComplete={method === 'phone' ? 'tel' : 'off'}
          inputMode={method === 'phone' ? 'tel' : 'text'}
          placeholder={contactCopy.placeholder}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          aria-required="true"
          aria-invalid={!!errors.contact}
          aria-describedby={describe('contact')}
        />
        {err('contact')}
      </div>

      <div className="field">
        <label htmlFor="field-weddingPlan">{copy.fields.weddingPlan.label}</label>
        <select
          id="field-weddingPlan"
          name="weddingPlan"
          value={weddingPlan}
          onChange={(e) => setWeddingPlan(e.target.value)}
          aria-invalid={!!errors.weddingPlan}
          aria-describedby={describe('weddingPlan')}
        >
          <option value="">{copy.fields.weddingPlan.empty}</option>
          {Object.entries(copy.fields.weddingPlan.options).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {err('weddingPlan')}
      </div>

      {/* Ловушка для ботов: скрыта от людей и скринридеров */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="field-website">Website</label>
        <input
          id="field-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="field field--check">
        <label className="check">
          <input
            id="field-consentPrivacy"
            type="checkbox"
            checked={consentPrivacy}
            onChange={(e) => setConsentPrivacy(e.target.checked)}
            aria-required="true"
            aria-invalid={!!errors.consentPrivacy}
            aria-describedby={describe('consentPrivacy')}
          />
          <span>
            {copy.fields.consentPrivacy} (
            <a href={event.legal.privacyUrl} target="_blank" rel="noopener noreferrer">
              {copy.fields.consentPrivacyLink}
            </a>
            )
          </span>
        </label>
        {err('consentPrivacy')}
      </div>

      {event.legal.marketingConsentEnabled && (
        <div className="field field--check">
          <label className="check">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
            />
            <span>{copy.fields.consentMarketing}</span>
          </label>
        </div>
      )}

      <button type="submit" className="btn btn--solid" disabled={busy}>
        {busy ? copy.submitting : CTA.submit}
      </button>

      <div className="form__status" role="alert" aria-live="assertive">
        {status === 'error' && <p className="field__error">{copy.error}</p>}
        {status === 'rate_limited' && <p className="field__error">{copy.rateLimited}</p>}
      </div>
    </form>
  )
}
