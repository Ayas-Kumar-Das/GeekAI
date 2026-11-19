import { PageHero } from '../components/public/PageHero'
import SpeakerCard from '../components/public/SpeakerCard'
import { ActionLink } from '../components/ui/ActionLink'
import { ArrowRight } from 'lucide-react'
import { speakers, speakersStatus } from '../content/speakers'

/**
 * Speakers — the placeholder lineup grid on the ink band (§7.1 item 6).
 * Eight labelled slots: no names, titles or affiliations are invented.
 */
export default function Speakers() {
  return (
    <>
      <PageHero
        eyebrow="03 — Speakers"
        title={speakersStatus.heading}
        lead={speakersStatus.body}
        crumbs={[
          { to: '/', label: 'Home' },
          { label: 'Speakers' },
        ]}
      />

      <section className="relative overflow-hidden bg-ink-900 text-ivory-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-65 -top-90 h-[720px] w-[720px] rounded-full border border-gold-500/10"
        />
        <div className="container-wide relative py-10 md:py-14">
          <ul className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
            {speakers.map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} />
            ))}
          </ul>

          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ivory-100/62">
            This grid is a placeholder layout. Slots fill in as the host office confirms each
            speaker — sessions and affiliations will be published here as they are announced.
          </p>

          <div className="mt-6">
            <ActionLink to="/programme" variant="gold">
              See the provisional programme
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ActionLink>
          </div>
        </div>
      </section>
    </>
  )
}
