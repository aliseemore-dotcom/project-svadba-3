// Единая конфигурация мероприятия.
// null = факт не подтверждён организатором. На сайте такие поля показываются как «уточняется».
// Не подставляйте сюда догадки: только подтверждённые данные.

export const PENDING = 'уточняется'

export interface EventConfig {
  name: string
  slogan: string
  date: { iso: string; label: string }
  audienceWeddingYear: number
  city: string | null
  venue: string | null
  startTime: string | null
  /** Цена или диапазон. Оплаты на сайте нет. */
  price: string | null
  /** Состав участия (на одного/пару, что включено) */
  participation: string | null
  organizer: { name: string | null; legalDetails: string | null }
  contacts: { phone: string | null; telegramUrl: string | null; socialUrl: string | null; email: string | null }
  /** Файл логотипа из /public (готовый файл, не набирается шрифтами сайта), например '/logo.svg' */
  logo: string | null
  raffle: {
    /** Правила розыгрыша утверждены и опубликованы на /raffle-rules. До этого анонс приза не публикуется. */
    rulesApproved: boolean
    rulesUrl: string
  }
  legal: {
    privacyUrl: string
    termsUrl: string
    /** Версия текста политики, фиксируется вместе с согласием */
    privacyPolicyVersion: string
    /** Рекламные рассылки не планируются: отдельного согласия в форме нет */
    marketingConsentEnabled: boolean
  }
}

export const event: EventConfig = {
  name: 'Проект: Свадьба 3',
  slogan: 'Ваша история в центре внимания.',
  date: { iso: '2026-11-07', label: '7 ноября 2026' },
  audienceWeddingYear: 2027,
  city: null,
  venue: null,
  startTime: null,
  price: null,
  participation: null,
  organizer: { name: null, legalDetails: null },
  contacts: { phone: null, telegramUrl: null, socialUrl: null, email: null },
  logo: null,
  raffle: { rulesApproved: false, rulesUrl: '/raffle-rules' },
  legal: {
    privacyUrl: '/privacy',
    termsUrl: '/terms',
    privacyPolicyVersion: 'draft-0',
    marketingConsentEnabled: false,
  },
}
