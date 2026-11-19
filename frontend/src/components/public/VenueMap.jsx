import { event } from '../../content/event'

/**
 * VenueMap — stylised schematic map (§7.1 venue, mockup 02): sand paper,
 * hairline roads, gold pin with the confirmed institution label, compass and
 * not-to-scale note. It is not a real map: no address, route or desk location
 * is invented. Decorative — the venue rows beside it carry the real facts.
 * 220px tall on mobile, 300px on desktop (§7.1 mobile).
 */
export function VenueMap() {
  const { institution, city, region } = event.venue

  return (
    <div
      role="img"
      aria-label={`Schematic location graphic for ${institution}, ${city}. Details to be announced.`}
      className="relative h-[220px] overflow-hidden rounded-xl border border-border bg-[#F2ECDF] lg:h-[300px]"
    >
      <svg
        viewBox="0 0 600 300"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* Hairline roads */}
        <g stroke="#D8C7AA" strokeWidth="1" fill="none">
          <path d="M-20 82 C90 74 150 98 230 92 S420 54 620 70" />
          <path d="M-20 176 C80 168 170 190 265 182 S450 148 620 164" />
          <path d="M-20 248 C110 232 210 252 330 238 S500 210 620 222" />
          <path d="M96 -20 C104 70 92 140 112 210 S130 270 136 320" />
          <path d="M250 -20 C242 60 262 118 252 190 S238 270 246 320" />
          <path d="M420 -20 C410 58 432 132 424 206 S414 280 430 320" />
          <path d="M540 -20 C530 70 552 154 544 230 S540 288 548 320" />
        </g>
        {/* Wide avenues */}
        <g stroke="#E8DCC8" strokeWidth="5" fill="none" opacity="0.8">
          <path d="M-20 176 C80 168 170 190 265 182 S450 148 620 164" />
          <path d="M250 -20 C242 60 262 118 252 190 S238 270 246 320" />
        </g>
        {/* Blocks */}
        <g fill="#D8C7AA" opacity="0.55">
          <rect x="150" y="108" width="58" height="34" rx="2" />
          <rect x="286" y="112" width="82" height="40" rx="2" />
          <rect x="160" y="204" width="52" height="28" rx="2" />
          <rect x="450" y="186" width="60" height="30" rx="2" />
        </g>
        {/* Campus radius */}
        <circle
          cx="300"
          cy="146"
          r="58"
          fill="rgba(201,162,39,.07)"
          stroke="rgba(201,162,39,.38)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      </svg>

      {/* Pin + label */}
      <span className="absolute left-1/2 top-[48%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-full border-[3px] border-ivory-50 bg-gold-500 shadow-[0_0_0_1px_rgba(11,31,58,.12),0_6px_16px_rgba(11,31,58,.18)]" />
        <span className="whitespace-nowrap rounded-[5px] border border-border bg-paper px-2.5 py-1.5 text-[10.5px] font-semibold text-ink-900 shadow-sm">
          {institution}
        </span>
      </span>

      {/* Compass */}
      <span
        aria-hidden="true"
        className="absolute right-3.5 top-3.5 grid h-[30px] w-[30px] place-items-center rounded-full border border-border-strong bg-paper/60 text-[9px] text-muted"
      >
        N
      </span>

      {/* Scale + honesty note */}
      <span className="absolute bottom-3 left-3.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        {city} · {region} · not to scale
      </span>
      <span className="absolute bottom-3 right-3.5 rounded-[5px] border border-border bg-paper/85 px-2 py-1 text-[9.5px] text-muted">
        Arrival desk location to be announced
      </span>
    </div>
  )
}

export default VenueMap
