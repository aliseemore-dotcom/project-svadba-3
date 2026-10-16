import { sections } from '../content/sections'
import { Section } from './Section'

export function PrologueSection() {
  const s = sections.prologue
  return (
    <Section id="prologue" kicker={s.kicker} title={s.title} titleId="prologue-title" tone="bordeaux">
      <div className="prose">
        {s.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Section>
  )
}
