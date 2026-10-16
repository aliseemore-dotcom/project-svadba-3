// События аналитики. Провайдер подключается отдельно после выбора и согласия на cookie:
// достаточно вызвать setAnalyticsSink(fn) с функцией отправки.

export type AnalyticsEvent =
  | 'page_view'
  | 'cta_click'
  | 'application_start'
  | 'application_submit_success'
  | 'application_submit_error'
  | 'vendors_scroll'
  | 'raffle_rules_open'

export type AnalyticsParams = Record<string, string | number | boolean | undefined>
type Sink = (event: AnalyticsEvent, params: AnalyticsParams) => void

let sink: Sink | null = null

export function setAnalyticsSink(fn: Sink | null): void {
  sink = fn
}

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  try {
    sink?.(event, params)
  } catch {
    // аналитика не должна ломать сайт
  }
}
