export interface Lead {
  id: string
  createdAt: string
  name: string
  contactMethod: 'phone' | 'telegram'
  contact: string
  weddingPlan: 'yes' | 'choosing_date' | 'other' | null
  consent: {
    privacy: true
    privacyPolicyVersion: string
    marketing: boolean
    at: string
  }
  source: { utm: Record<string, string>; pageUrl: string | null }
  event: string
}

/** Канал доставки заявки: CRM, таблица, Telegram и т.д. */
export interface LeadSink {
  name: string
  deliver(lead: Lead): Promise<void>
}

export type DeliveryStatus = 'delivered' | 'failed'
