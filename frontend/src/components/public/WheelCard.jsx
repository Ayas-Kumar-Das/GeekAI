import KonarkMark from './KonarkMark'

/**
 * WheelCard — the ink hero card: gold rim, cropped line wheel, quote and
 * meta. Keeps the approved visual; the caption now names the Geek AI portal
 * and the event it currently serves. No coordinates or dates appear on it.
 * 158px tall on mobile (wheel cropped bottom-right), 390px on desktop.
 */
export function WheelCard() {
  return (
    <div className="relative h-[158px] overflow-hidden rounded-[14px] bg-ink-900 text-ivory-100 shadow-lg md:h-[390px] md:rounded-[22px]">
      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(180px 120px at 80% 20%, rgba(56,189,248,.10), transparent 70%)',
        }}
      />
      {/* Orbits (desktop only) */}
      <div
        aria-hidden="true"
        className="absolute -right-27 -top-30 hidden h-[380px] w-[380px] rounded-full border border-gold-500/24 md:block"
      />
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-19 hidden h-[292px] w-[292px] rounded-full border border-ivory-100/9 md:block"
      />

      {/* Kicker */}
      <span className="absolute left-4 top-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-ivory-100/55 md:left-6 md:top-6 md:text-[10px]">
        The Konark wheel
      </span>

      {/* Wheel — cropped at the edge */}
      <KonarkMark
        className="absolute -bottom-1.5 -right-2 h-[142px] w-[142px] text-gold-500 md:-right-27 md:top-6.5 md:bottom-auto md:h-[300px] md:w-[300px]"
        strokeWidth={1.1}
        aria-hidden="true"
      />

      {/* Caption */}
      <p className="absolute left-4 top-11 w-[170px] text-[15px] font-semibold leading-[1.3] tracking-[-0.015em] text-ivory-50 md:left-6 md:top-auto md:bottom-[68px] md:w-[230px] md:text-[17px] md:leading-[1.34] md:tracking-normal">
        “Registration, handled by Geek AI.”
      </p>
      <div className="absolute bottom-3.5 left-4 font-mono text-[8px] uppercase leading-relaxed tracking-[0.16em] text-ivory-100/56 md:bottom-5.5 md:left-6 md:text-[9.5px] md:tracking-[0.14em]">
        <span className="block">Geek AI developer team</span>
        <span className="block">Currently serving AIS 2026</span>
      </div>
    </div>
  )
}

export default WheelCard
