import { cn } from '../../lib/cn'

const nodes = {
  gold: 'bg-gold-500 shadow-[0_0_0_4px_rgba(201,162,39,.13)]',
  teal: 'bg-teal-500 shadow-[0_0_0_4px_rgba(14,124,123,.12)]',
  sand: 'bg-sand-300 shadow-[0_0_0_4px_rgba(216,199,170,.22)]',
}

const tags = {
  gold: 'border-gold-500/40 bg-gold-100 text-gold-700',
  plain: 'border-border bg-paper text-slate-700',
}

/**
 * ProgrammeRow — timeline row for the programme page (§7.1 programme,
 * mockup 02): node + session ref + time | title, description, tags |
 * meta cell with a left rule. No "session details" link is rendered —
 * that page does not exist yet, and dead links are worse than honest text.
 */
export function ProgrammeRow({ session }) {
  return (
    <article className="grid min-h-[101px] grid-cols-1 border-t border-border md:grid-cols-[132px_1fr_250px]">
      {/* Node + ref/time */}
      <div className="flex gap-3 pt-4 md:pr-4.5 md:pt-4.5">
        <span
          aria-hidden="true"
          className={cn(
            'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
            nodes[session.tone] ?? nodes.sand
          )}
        />
        <div className="min-w-0">
          <b className="block font-mono text-[11px] font-semibold tracking-[0.02em] text-ink-900">
            {session.ref.toUpperCase()}
          </b>
          <span className="mt-0.5 block text-[10px] text-muted">{session.time}</span>
        </div>
      </div>

      {/* Main */}
      <div className="py-3.5 md:pr-6.5 md:pt-4">
        <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-ink-900">
          {session.title}
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{session.description}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {session.tags.map((tag, index) => (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-medium',
                index === 0 && session.tone === 'gold'
                  ? tags.gold
                  : tags.plain
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col justify-between items-start gap-3 border-t border-border py-3.5 md:justify-start md:border-t-0 md:border-l md:py-4 md:pl-5.5">
        <span className="text-[10.5px] text-muted">{session.meta}</span>
        <span className="text-[11.5px] font-semibold text-slate-700">{session.detail}</span>
      </div>
    </article>
  )
}

export default ProgrammeRow
