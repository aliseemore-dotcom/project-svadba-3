import { sections } from '../content/sections'
import { Section } from './Section'

export function ImmersiveDinnerSection() {
  const s = sections.dinner
  return (
    <Section id="dinner" kicker={s.kicker} title={s.title} titleId="dinner-title">
      <div className="prose">
        <p>{s.text}</p>
      </div>
      <p className="lead-italic lead-italic--quote">{s.caption}</p>
    </Section>
  )
}
