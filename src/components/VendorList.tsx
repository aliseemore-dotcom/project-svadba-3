import { useRef } from 'react'
import type { Vendor } from '../content/vendors'
import { track } from '../lib/analytics'

interface Props {
  vendors: Vendor[]
  label: string
}

export function VendorList({ vendors, label }: Props) {
  const ref = useRef<HTMLUListElement>(null)
  const tracked = useRef(false)

  const onScroll = () => {
    if (tracked.current) return
    tracked.current = true
    track('vendors_scroll')
  }
  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' })
    onScroll()
  }

  return (
    <div className="vendors">
      <ul
        ref={ref}
        className="vendors__track"
        // прокручиваемая область доступна с клавиатуры (стрелки) и сенсорно
        tabIndex={0}
        role="region"
        aria-label={label}
        onScroll={onScroll}
      >
        {vendors.map((v) => (
          <li key={v.id} className="vendor">
            <div className="vendor__photo">
              {v.photo ? <img src={v.photo} alt={v.name} loading="lazy" /> : <span aria-hidden="true">фото</span>}
            </div>
            <h3 className="vendor__name">{v.name}</h3>
            <p className="vendor__specialty">{v.specialty}</p>
            {v.shortBio && <p className="vendor__bio">{v.shortBio}</p>}
            {v.profileUrl && (
              <a href={v.profileUrl} target="_blank" rel="noopener noreferrer" className="vendor__link">
                Профиль<span className="sr-only"> — {v.name}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
      <div className="vendors__nav">
        <button type="button" className="btn btn--outline btn--small" onClick={() => scrollBy(-1)} aria-label="Назад">
          ←
        </button>
        <button type="button" className="btn btn--outline btn--small" onClick={() => scrollBy(1)} aria-label="Вперёд">
          →
        </button>
      </div>
    </div>
  )
}
