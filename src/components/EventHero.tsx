import { event } from '../content/event'
import { isRaffleVisible } from '../content/preview'
import { CTA, sections } from '../content/sections'
import { track } from '../lib/analytics'
import { CtaButton } from './CtaButton'

export function EventHero() {
  const s = sections.hero
  return (
    <header className="hero" aria-labelledby="hero-title">
      <div className="hero__spot" aria-hidden="true" />
      <div className="container hero__inner">
        {event.logo && <img className="hero__logo" src={event.logo} alt={event.name} />}
        <p className="kicker">{s.kicker}</p>
        <p className="hero__eyebrow">
          {event.date.label} · {s.eyebrow}
        </p>
        <h1 id="hero-title" className="h-hero">
          <span className="h-hero__line">Проект:</span>
          <span className="h-hero__line h-hero__line--shift">
            Свадьба 3<span className="calligraphy" aria-hidden="true">{s.calligraphy}</span>
          </span>
        </h1>
        <p className="lead-italic">{event.slogan}</p>
        <p className="hero__text">{s.description}</p>
        {isRaffleVisible() && (
          <p className="hero__raffle">
            {s.raffleAnnounce}{' '}
            <a href={event.raffle.rulesUrl} onClick={() => track('raffle_rules_open', { block: 'hero' })}>
              {s.raffleLinkLabel}
            </a>
          </p>
        )}
        <CtaButton block="hero" label={CTA.primary} variant="solid" />
      </div>
    </header>
  )
}
