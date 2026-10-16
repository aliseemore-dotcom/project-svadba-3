import { event } from '../content/event'
import { isRaffleVisible } from '../content/preview'
import { CTA, sections } from '../content/sections'
import { track } from '../lib/analytics'
import { CtaButton } from './CtaButton'
import { Section } from './Section'

export function BenefitsSection() {
  const s = sections.benefits
  const items = s.items.filter((i) => !i.needsRaffle || isRaffleVisible())
  return (
    <Section id="benefits" kicker={s.kicker} title={s.title} titleId="benefits-title">
      <div className="prose">
        <p>{s.intro}</p>
      </div>
      <ol className="benefits">
        {items.map((i) => (
          <li key={i.id} className="benefit">
            <h3 className="benefit__title">{i.title}</h3>
            <p>
              {i.text}
              {i.needsRaffle && (
                <>
                  {' '}
                  <a href={event.raffle.rulesUrl} onClick={() => track('raffle_rules_open', { block: 'benefits' })}>
                    Условия и правила розыгрыша
                  </a>
                </>
              )}
            </p>
          </li>
        ))}
      </ol>
      <CtaButton block="benefits" label={CTA.primary} />
    </Section>
  )
}
