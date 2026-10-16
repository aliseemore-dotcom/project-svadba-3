import { useEffect } from 'react'
import { event } from '../content/event'
import { track } from '../lib/analytics'

const PAGES = {
  privacy: { title: 'Политика обработки персональных данных', what: 'политики обработки персональных данных' },
  terms: { title: 'Условия участия', what: 'условий участия' },
  raffle: { title: 'Правила розыгрыша', what: 'правил розыгрыша (объём приза, ограничения, условия участия, порядок определения победителя, организатор)' },
} as const

/** Правовые страницы: утверждённые тексты вставляет организатор. До этого — явная заглушка. */
export function LegalPage({ kind }: { kind: keyof typeof PAGES }) {
  const p = PAGES[kind]
  useEffect(() => {
    document.title = `${p.title} — ${event.name}`
    if (kind === 'raffle') track('raffle_rules_open', { block: 'rules_page' })
  }, [kind, p.title])
  return (
    <main className="legal container">
      <p className="kicker">
        <a href="/">{event.name}</a>
      </p>
      <h1 className="h-section">{p.title}</h1>
      <div className="legal__placeholder" role="note">
        <p>[ДОКУМЕНТ НЕ УТВЕРЖДЁН]</p>
        <p>Здесь должен быть размещён утверждённый текст {p.what}. Страница не заполнена и не является действующим документом.</p>
      </div>
    </main>
  )
}
