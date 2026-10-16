import { event } from './event'

// Отдельно от event.ts: event.ts импортирует и сервер (api/lead), где import.meta.env нет.

/** Тестовая сборка: показываем заглушки вместо скрытых блоков. На публичном сайте выключено. */
export const PREVIEW: boolean =
  import.meta.env.DEV || import.meta.env.VITE_PREVIEW_PLACEHOLDERS === 'true'

/** Анонс приза публикуем только при утверждённых правилах (или в тестовой сборке). */
export const isRaffleVisible = (): boolean => event.raffle.rulesApproved || PREVIEW
