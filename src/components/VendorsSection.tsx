import { PREVIEW } from '../content/preview'
import { CTA, sections } from '../content/sections'
import { getPublishedVendors, vendorPlaceholders, vendors } from '../content/vendors'
import { CtaButton } from './CtaButton'
import { Section } from './Section'
import { VendorList } from './VendorList'

export function VendorsSection() {
  const s = sections.vendors
  let list = getPublishedVendors(vendors)
  // Без реальных данных на публичном сайте список не показываем; в тестовой сборке — заглушки
  if (list.length === 0 && PREVIEW) list = vendorPlaceholders
  return (
    <Section id="vendors" kicker={s.kicker} title={s.title} titleId="vendors-title" tone="bordeaux">
      <div className="prose">
        <p>{s.text}</p>
      </div>
      {list.length > 0 && <VendorList vendors={list} label={s.listLabel} />}
      <CtaButton block="vendors" label={CTA.vendors} />
    </Section>
  )
}
