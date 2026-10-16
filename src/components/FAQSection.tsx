import { PREVIEW } from '../content/preview'
import { faq, getPublishedFaq } from '../content/faq'
import { sections } from '../content/sections'

export function FAQSection() {
  const s = sections.epilogue
  let items: { question: string; answer: string }[] = getPublishedFaq(faq)
  // Тестовая сборка: показываем вопросы с явной пометкой, что ответа ещё нет
  if (items.length === 0 && PREVIEW) {
    items = faq.map((f) => ({ question: f.question, answer: '[Ответ будет добавлен после подтверждения условий]' }))
  }
  if (items.length === 0) return null
  return (
    <section id="faq" className="section section--night" aria-labelledby="faq-title">
      <div className="container">
        <p className="kicker">{s.kicker}</p>
        <h2 id="faq-title" className="h-section">
          {s.faqTitle}
        </h2>
        <div className="faq">
          {items.map((f) => (
            <details key={f.question} className="faq__item">
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
