// Подрядчики. Только реальные данные: имена, фото и ссылки подтверждает организатор.
// Пустой массив = блок со списком на публичном сайте не показывается.

export interface Vendor {
  id: string
  name: string
  specialty: string
  photo: string
  shortBio?: string
  profileUrl?: string
  order: number
  isPublished: boolean
}

export const vendors: Vendor[] = []

/** Технические заглушки: только для тестовой сборки (VITE_PREVIEW_PLACEHOLDERS=true / dev). */
export const vendorPlaceholders: Vendor[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `placeholder-${n}`,
  name: `[Имя специалиста ${n}]`,
  specialty: '[Специализация]',
  photo: '',
  order: n,
  isPublished: true,
}))

export function getPublishedVendors(list: Vendor[]): Vendor[] {
  return list.filter((v) => v.isPublished).sort((a, b) => a.order - b.order)
}
