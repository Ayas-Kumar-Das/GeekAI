import { useState } from 'react'
import { PageHero } from '../components/public/PageHero'
import ProgrammeRow from '../components/public/ProgrammeRow'
import EmptyState from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/cn'
import { sessions, demoFloor, tracks, programmeStatus } from '../content/programme'

/**
 * Programme — provisional schedule with track tabs (§7.1 programme,
 * mockup 02). All rows are placeholders: no times, speakers or titles are
 * invented, and tabs filter client-side so no API is required.
 */
export default function Programme() {
  const [active, setActive] = useState('all')

  const all = [...sessions, demoFloor]
  const visible = active === 'all' ? all : all.filter((s) => s.track === active)

  return (
    <>
      <PageHero
        eyebrow="02 — Programme"
        title="A programme in progress."
        lead="Talks, research and hands-on workshops. Session titles, speakers and times will be published as they are confirmed."
        crumbs={[
          { to: '/', label: 'Home' },
          { label: 'Programme' },
        ]}
        wide
      >
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Badge tone="outline">{programmeStatus.pill}</Badge>
          <span className="text-xs text-muted">{programmeStatus.note}</span>
        </div>
      </PageHero>

      <div className="container-wide py-8 md:py-12">
        {/* Track tabs */}
        <div
          role="tablist"
          aria-label="Filter sessions by track"
          className="flex flex-wrap gap-2"
        >
          {tracks.map((track) => {
            const selected = active === track.id
            return (
              <button
                key={track.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(track.id)}
                className={cn(
                  'inline-flex h-8 items-center rounded-full border px-3.5 text-[11.5px] font-semibold transition-colors duration-fast',
                  selected
                    ? 'border-ink-900 bg-ink-900 text-ivory-100'
                    : 'border-border bg-paper text-muted hover:border-border-strong hover:text-ink-900'
                )}
              >
                {track.label}
              </button>
            )
          })}
        </div>

        {/* Timeline */}
        <div className="mt-5 border-b border-border">
          {visible.length === 0 ? (
            <div className="border-t border-border pt-8">
              <EmptyState
                title={programmeStatus.empty}
                body="Check back closer to the event, or register your interest and the host office will keep you posted."
                action={
                  <a
                    href="/register"
                    className="inline-flex h-11 items-center rounded-sm bg-ink-900 px-4 text-sm font-medium text-ivory-50 transition-colors duration-fast hover:bg-ink-800"
                  >
                    Register interest
                  </a>
                }
              />
            </div>
          ) : (
            visible.map((session) => <ProgrammeRow key={session.id} session={session} />)
          )}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Times, titles and speakers are placeholders until the host office confirms them.
          Nothing on this page should be read as a final schedule.
        </p>
      </div>
    </>
  )
}
