import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * SessionCard — one session card in the landing programme preview
 * (§7.1 item 5, mockup 01): left colour bar, mono track + time, title and
 * an honest placeholder subtitle. Cards link to the programme page; there is
 * no session detail page yet, so no dead links are rendered.
 */
const bars = {
  gold: 'bg-gold-500',
  teal: 'bg-teal-500',
  sand: 'bg-sand-300',
}

export function SessionCard({ session }) {
  return (
    <article className="flex h-[92px] gap-3.5 rounded-[10px] border border-border bg-paper p-3.5">
      <span
        aria-hidden="true"
        className={`w-0.75 shrink-0 self-stretch rounded-[3px] ${bars[session.tone] ?? bars.sand}`}
      />
      <div className="w-[58px] shrink-0 pt-0.5">
        <b className="block whitespace-nowrap font-mono text-[11.5px] font-semibold text-ink-900">
          {(session.trackRef ?? session.ref).toUpperCase()}
        </b>
        <span className="mt-0.5 block text-[9.5px] uppercase tracking-[0.06em] text-muted">
          {session.time}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold leading-tight tracking-[-0.01em] text-ink-900">
          {session.title}
        </h3>
        <p className="mt-1 truncate text-[11px] text-muted">{session.subtitle}</p>
      </div>
    </article>
  )
}

/**
 * MiniRow — the compact programme rows used in the mobile preview
 * (mockup 03): bar, title and one-line placeholder, full-width tap target.
 */
export function MiniRow({ session }) {
  return (
    <Link
      to="/programme"
      className="flex items-start gap-2.5 border-b border-border py-2.5 transition-colors duration-fast hover:bg-sand-100"
    >
      <span
        aria-hidden="true"
        className={`h-8 w-0.75 shrink-0 rounded-[3px] ${bars[session.tone] ?? bars.sand}`}
      />
      <span className="min-w-0">
        <span className="block text-xs font-semibold tracking-[-0.005em] text-ink-900">
          {session.title}
        </span>
        <span className="mt-0.5 block text-[10px] text-muted">{session.subtitle}</span>
      </span>
      <ArrowRight className="ml-auto mt-1.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  )
}

export default SessionCard
