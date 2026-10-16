import type { ReactNode } from 'react'
import { useReveal } from '../lib/useReveal'

interface Props {
  id?: string
  kicker: string
  title: string
  tone?: 'night' | 'bordeaux'
  titleId: string
  children: ReactNode
}

export function Section({ id, kicker, title, tone = 'night', titleId, children }: Props) {
  const ref = useReveal<HTMLElement>()
  return (
    <section id={id} ref={ref} className={`section section--${tone} reveal`} aria-labelledby={titleId}>
      <div className="container">
        <p className="kicker">{kicker}</p>
        <h2 id={titleId} className="h-section">
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}
