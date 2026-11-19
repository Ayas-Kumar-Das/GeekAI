import { UserRound } from 'lucide-react'

/**
 * SpeakerCard — placeholder slot on the ink speakers band (§7.1 item 6,
 * mockup 02): numbered ink-gradient card, line avatar and a bottom label.
 * No invented names, titles or affiliations (§4.2 voice).
 */
export function SpeakerCard({ speaker }) {
  const num = String(speaker.id).padStart(2, '0')

  return (
    <li className="relative h-[206px] overflow-hidden rounded-[10px] border border-ivory-100/12 bg-ink-800 transition-colors duration-fast hover:border-gold-500/40">
      {/* Card gradients */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(145deg, rgba(255,255,255,.045), transparent 55%), linear-gradient(180deg, #162E51 0%, #102542 100%)',
        }}
      />
      {/* Halo ring */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[30px] h-[150px] w-[150px] -translate-x-1/2 rounded-full border border-gold-500/18"
      />

      <span className="absolute left-3.5 top-3 font-mono text-[9.5px] text-ivory-100/56">
        {num}
      </span>

      <span className="absolute left-1/2 top-16 flex h-[70px] w-[70px] -translate-x-1/2 items-center justify-center rounded-full border border-ivory-100/16 bg-gold-500/24">
        <UserRound className="h-7 w-7 text-ivory-100/55" aria-hidden="true" strokeWidth={1.5} />
      </span>

      <p className="absolute inset-x-3.5 bottom-3.5 border-t border-ivory-100/10 pt-2.5 text-[10.5px] tracking-[0.04em] text-ivory-100/55">
        {speaker.label}
        <span className="sr-only"> — placeholder slot, lineup not yet announced</span>
      </p>
    </li>
  )
}

export default SpeakerCard
