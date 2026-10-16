import { event, PENDING } from '../content/event'
import { sections } from '../content/sections'
import { Section } from './Section'
import { ApplicationForm } from './ApplicationForm'

export function ApplicationSection() {
  const s = sections.application
  const L = s.infoLabels
  const facts: [string, string][] = [
    [L.date, event.date.label],
    [L.city, event.city ?? PENDING],
    [L.venue, event.venue ?? PENDING],
    [L.time, event.startTime ?? PENDING],
    [L.price, event.price ?? PENDING],
    [L.participation, event.participation ?? PENDING],
  ]
  return (
    <Section id="application" kicker={s.kicker} title={s.title} titleId="application-title" tone="bordeaux">
      <div className="prose">
        <p>{s.text}</p>
      </div>
      <div className="application">
        <aside className="ticket" aria-label={s.infoTitle}>
          <p className="kicker kicker--small">{s.infoTitle}</p>
          <dl>
            {facts.map(([k, v]) => (
              <div key={k} className="ticket__row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <hr className="ticket__tear" />
          <p className="ticket__note">{s.note}</p>
        </aside>
        <ApplicationForm />
      </div>
    </Section>
  )
}
