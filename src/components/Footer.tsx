import { event } from '../content/event'
import { sections } from '../content/sections'

export function Footer() {
  const s = sections.epilogue
  const c = event.contacts
  const contactLinks: { href: string; label: string }[] = []
  if (c.phone) contactLinks.push({ href: `tel:${c.phone.replace(/[^\d+]/g, '')}`, label: c.phone })
  if (c.telegramUrl) contactLinks.push({ href: c.telegramUrl, label: 'Telegram' })
  if (c.socialUrl) contactLinks.push({ href: c.socialUrl, label: 'Соцсети' })
  if (c.email) contactLinks.push({ href: `mailto:${c.email}`, label: c.email })

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <p className="footer__name">{event.name}</p>
          <p>{event.date.label}</p>
        </div>
        <div>
          <p className="kicker kicker--small">{s.contactsTitle}</p>
          <p>{event.organizer.name ?? s.pending}</p>
          {event.organizer.legalDetails && <p className="footer__small">{event.organizer.legalDetails}</p>}
          {contactLinks.length > 0 && (
            <ul>
              {contactLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="kicker kicker--small">{s.linksTitle}</p>
          <ul>
            <li>
              <a href={event.legal.privacyUrl}>Политика обработки персональных данных</a>
            </li>
            <li>
              <a href={event.legal.termsUrl}>Условия участия</a>
            </li>
            <li>
              <a href={event.raffle.rulesUrl}>Правила розыгрыша</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
