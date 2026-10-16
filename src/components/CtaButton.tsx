import type { MouseEvent } from 'react'
import { track } from '../lib/analytics'

interface Props {
  /** Название блока для аналитики */
  block: string
  label: string
  variant?: 'solid' | 'outline'
}

/** Единая логика всех CTA: якорь #application + плавная прокрутка и фокус на форме. */
export function CtaButton({ block, label, variant = 'outline' }: Props) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    track('cta_click', { block })
    const target = document.getElementById('application')
    if (!target) return
    e.preventDefault()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
    window.history.replaceState(null, '', '#application')
    target.querySelector<HTMLElement>('input, select, button')?.focus({ preventScroll: true })
  }
  return (
    <a href="#application" className={`btn btn--${variant}`} onClick={onClick}>
      {label}
    </a>
  )
}
