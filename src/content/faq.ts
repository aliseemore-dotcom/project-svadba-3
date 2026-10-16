// FAQ. Ответы вносит организатор после подтверждения условий.
// Пока answer = null или isPublished = false, вопрос не публикуется.

export interface FaqItem {
  question: string
  answer: string | null
  isPublished: boolean
}

export const faq: FaqItem[] = [
  { question: 'Как узнать стоимость?', answer: null, isPublished: false },
  { question: 'Как подтвердить участие?', answer: null, isPublished: false },
  { question: 'Где проходит вечер?', answer: null, isPublished: false },
  { question: 'Как участвовать в розыгрыше?', answer: null, isPublished: false },
]

export function getPublishedFaq(list: FaqItem[]): (FaqItem & { answer: string })[] {
  return list.filter((f): f is FaqItem & { answer: string } => f.isPublished && !!f.answer)
}
