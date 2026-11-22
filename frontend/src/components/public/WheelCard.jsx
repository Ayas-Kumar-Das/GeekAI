import KonarkMark from './KonarkMark'
import { platform, event } from '../../content/event'

/**
 * WheelCard — the ink hero card: gold rim, full line wheel, quote and meta.
 * Keeps the approved visual; the wheel sits fully inside the card (no crop)
 * and the caption names the GeekAI portal and the event it currently serves.
 * 158px tall on mobile, 390px on desktop.
 */
export function WheelCard() {
  return (
    <div className="relative h-[158px] overflow-hidden rounded-[14px] bg-ink-900 text-ivory-100 shadow-lg md:h-[390px] md:rounded-[22px]">
      {/* Radial accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(180px 120px at 80% 20%, rgba(56,189,248,.10), transparent 70%)',
        }}
      />

      {/* Kicker */}
      <span className="absolute left-4 top-3.5 z-10 text-[9px] font-semibold uppercase tracking-[0.18em] text-ivory-100/55 md:left-6 md:top-6 md:text-[10px]">
        The Konark wheel
      </span>

      {/* Wheel — fully contained within the card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-1 md:pr-6">
        <KonarkMark
          className="h-[118px] w-[118px] text-gold-500 md:h-[250px] md:w-[250px]"
          strokeWidth={1.1}
          aria-hidden="true"
        />
      </div>

      {/* Caption */}
      <p className="absolute left-4 top-11 z-10 w-[160px] text-[14px] font-semibold leading-[1.3] tracking-[-0.015em] text-ivory-50 md:left-6 md:top-auto md:bottom-[74px] md:w-[240px] md:text-[17px] md:leading-[1.34] md:tracking-normal">
        “Registration, handled by GeekAI.”
      </p>
      <div className="absolute bottom-3.5 left-4 z-10 font-mono text-[8px] uppercase leading-relaxed tracking-[0.16em] text-ivory-100/56 md:bottom-5.5 md:left-6 md:text-[9.5px] md:tracking-[0.14em]">
        <span className="block">{platform.owner}</span>
        <span className="block">Currently serving {event.shortName}</span>
      </div>
    </div>
  )
}

export default WheelCard
