import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, MapPin, Ticket } from 'lucide-react'
import WheelCard from '../components/public/WheelCard'
import FactStrip from '../components/public/FactStrip'
import SessionCard, { MiniRow } from '../components/public/SessionCard'
import FaqAccordion from '../components/public/FaqAccordion'
import StepExplainer from '../components/public/StepExplainer'
import VenueMap from '../components/public/VenueMap'
import { SectionLabel, Eyebrow } from '../components/public/SectionLabel'
import { ActionLink } from '../components/ui/ActionLink'
import { Badge } from '../components/ui/Badge'
import { sessions, programmeStatus } from '../content/programme'
import { featuredFaqs, faqStatus } from '../content/faq'
import { venue } from '../content/venue'
import { event, platform } from '../content/event'

/** Sticky bottom bar — mobile only, 78px + safe area (§7.1 mobile, mockup 03). */
function MobileStickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div
      className="sticky-cta fixed inset-x-0 bottom-0 z-30 border-t border-border bg-ivory-100/97 px-[18px] pb-[env(safe-area-inset-bottom)] pt-2.5 backdrop-blur-sm lg:hidden"
      style={{ minHeight: '78px' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10.5px] font-semibold leading-tight text-ink-900">
            GeekAI registration
          </p>
          <p className="mt-0.5 truncate text-[9px] text-muted">For {event.shortName}</p>
        </div>
        <ActionLink to="/register" variant="primary" className="h-10 shrink-0 px-[15px] text-xs">
          Register interest
        </ActionLink>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            'radial-gradient(760px 420px at 77% 34%, rgba(201,162,39,.10), transparent 64%), linear-gradient(180deg, #FBF8F1 0%, #F7F3EA 100%)',
        }}
      >
        {/* Faint 12-column rule (§7.1 hero), masked to the right side */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(11,31,58,.045) 1px, transparent 1px)',
            backgroundSize: '96px 100%',
            maskImage: 'linear-gradient(to right, transparent 0, #000 42%, #000 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 42%, #000 100%)',
          }}
        />

        <div className="container-wide relative grid items-center gap-10 py-9 md:py-14 lg:grid-cols-[1.03fr_.97fr] lg:gap-[70px] lg:items-start lg:py-16">
          <div className="lg:pb-1">
            <Eyebrow>{platform.eyebrow}</Eyebrow>

            <h1 className="mt-3 text-display font-semibold text-ink-900">
              Registration,
              <br />
              handled by GeekAI.
            </h1>

            <p className="mt-4.5 max-w-[500px] text-lead text-slate-700">
              {platform.purpose} — an in-site form, a clear status page and a pass issued at the
              arrival desk.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 lg:gap-5">
              <ActionLink to="/register" size="lg" className="w-full justify-center sm:w-auto">
                Register interest
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink to="/programme" variant="link" size="lg" className="px-0">
                Explore the programme
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ActionLink>
            </div>

            {/* Fact row — inline items with rules (§7.1 hero) */}
            <ul className="mt-7 flex flex-wrap items-center text-[11.5px] text-muted">
              <li className="flex items-center gap-1.5 border-r border-border py-1 pr-3.5 first:pl-0 last:border-r-0">
                <CalendarDays className="h-3.5 w-3.5 text-gold-600" aria-hidden="true" />
                {event.dateLabel}
              </li>
              <li className="flex items-center gap-1.5 border-r border-border px-3.5 py-1 last:border-r-0">
                <MapPin className="h-3.5 w-3.5 text-gold-600" aria-hidden="true" />
                {event.venue.label}
              </li>
              <li className="flex items-center gap-1.5 px-3.5 py-1">
                <Ticket className="h-3.5 w-3.5 text-gold-600" aria-hidden="true" />
                In person · registration required
              </li>
            </ul>

            <p className="mt-5 max-w-md text-xs leading-relaxed text-muted">
              {platform.status} {event.name}. Event details come from the event team; GeekAI
              operates this registration portal only.
            </p>
          </div>

          <div className="lg:pr-7">
            <WheelCard />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Three facts */}
      <FactStrip />

      {/* ----------------------------------------------- Programme preview */}
      <section className="container-wide py-10 md:py-13">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>Programme</Eyebrow>
              <Badge tone="outline">{programmeStatus.pill}</Badge>
            </div>
            <h2 className="mt-1.5 text-h3 font-semibold tracking-[-0.025em] text-ink-900">
              A programme in progress.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="text-xs text-muted">
              Full schedule to be announced
            </span>
            <ActionLink to="/programme" variant="link" size="sm" className="px-0 text-xs font-semibold">
              View programme
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </ActionLink>
          </div>
        </div>

        {/* Desktop: three cards (mockup 01) */}
        <div className="mt-4 hidden gap-4 md:grid md:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>

        {/* Mobile: two compact rows + view-all (§7.1 mobile) */}
        <div className="mt-3 border-t border-border md:hidden">
          {sessions.slice(0, 2).map((session) => (
            <MiniRow key={session.id} session={session} />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- How it works */}
      <section className="border-y border-border bg-paper">
        <div className="container-wide py-12 md:py-16">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-3 max-w-2xl text-h3 font-semibold tracking-[-0.02em] text-ink-900">
            From the form to the arrival desk.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700">
            The GeekAI portal takes your details, photo and consent in a few minutes. The event
            team reviews them, and your pass is issued in person at the arrival desk — nothing is
            emailed to you before the event.
          </p>
          <div className="mt-9">
            <StepExplainer />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Venue */}
      <section className="container-wide border-b border-border py-12 md:py-15">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>Venue</SectionLabel>
            <h2 className="mt-3 text-h3 font-semibold tracking-[-0.02em] text-ink-900">
              {venue.heading}
            </h2>
          </div>
          <p className="max-w-[280px] text-right text-xs leading-relaxed text-muted">
            {venue.note}
          </p>
        </div>

        <div className="mt-6.5 grid items-stretch gap-9 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
          <VenueMap />

          <div className="flex flex-col">
            <dl>
              {venue.rows.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-[96px_1fr] gap-4 border-b border-border py-3.5"
                >
                  <dt className="pt-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                    {row.key}
                  </dt>
                  <dd className="text-[13px] leading-relaxed text-slate-700">
                    {row.title && <b className="block font-semibold text-ink-900">{row.title}</b>}
                    <span className="block">{row.body}</span>
                    {row.note && (
                      <span className="mt-1 block text-xs text-muted">{row.note}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Accessibility note (mockup 02) */}
            <div className="mt-4 flex gap-3 rounded-lg border border-sand-200 bg-sand-100 p-3.5">
              <span
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-gold-600"
              />
              <p className="text-[11.5px] leading-relaxed text-[#5A4D38]">{venue.accessNote}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ActionLink to="/venue" variant="secondary" size="sm">
                Travel notes
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </ActionLink>
              <ActionLink to="/faq" variant="link" size="sm">
                Contact the team
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </ActionLink>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <section className="container-wide py-12 md:py-15">
        <div className="grid gap-9 lg:grid-cols-[330px_1fr] lg:gap-16">
          <div>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-3 text-h2 font-semibold text-ink-900">{faqStatus.heading}</h2>
            <p className="mt-3 max-w-[270px] text-xs leading-relaxed text-muted">
              {faqStatus.body}
            </p>
            <div className="mt-3.5">
              <ActionLink to="/faq" variant="link" size="sm">
                Contact the team
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </ActionLink>
            </div>
          </div>
          <div>
            <FaqAccordion items={featuredFaqs} idPrefix="home-faq" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ CTA band */}
      <section className="bg-ink-900 text-ivory-50">
        <div className="container-wide flex flex-col items-start gap-6 py-12 md:flex-row md:items-center md:justify-between md:py-14">
          <div>
            <SectionLabel onDark>Registration</SectionLabel>
            <h2 className="mt-3 text-h3 font-semibold tracking-[-0.02em]">Registration required.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory-100/76">
              Entry is in person only. Register through the GeekAI portal; your pass is issued
              at the arrival desk. {event.dateLabel} — expressions of interest are open.
            </p>
          </div>
          <ActionLink to="/register" variant="gold" size="lg" className="shrink-0">
            Register interest
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ActionLink>
        </div>
      </section>

      <MobileStickyCta />
      {/* Space for the sticky bar on small screens */}
      <div aria-hidden="true" className="h-[78px] lg:hidden" />
    </>
  )
}
