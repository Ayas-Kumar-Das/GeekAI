import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageHero, PlaceholderBadge } from '../components/public/PageHero'
import { ActionLink } from '../components/ui/ActionLink'
import Banner from '../components/ui/Banner'

/**
 * RegistrationStatus — interim placeholder for `/registration/status`.
 * The full state matrix (§7.3) ships in Stage 3; until then this route must
 * still resolve so every "check status" CTA lands somewhere honest instead of
 * a 404. It never claims to look anything up.
 */
export default function RegistrationStatus() {
  return (
    <>
      <PageHero
        eyebrow="Registration status"
        title="Check your registration status."
        lead="Status lookup is being built. Until it opens, the host office can confirm your registration directly."
        crumbs={[
          { to: '/', label: 'Home' },
          { label: 'Registration status' },
        ]}
      />

      <div className="container-prose py-8 pb-16 md:pb-24">
        <Banner tone="info" title="Lookup coming soon" className="mb-6">
          This page will let you check your registration with the email address you used.
          It is not live yet — nothing is looked up when you land here.
        </Banner>

        <ol className="border-t border-border">
          <li className="grid grid-cols-[36px_1fr] gap-4 border-b border-border py-4">
            <span className="font-mono text-sm font-semibold text-gold-700">1</span>
            <div>
              <h2 className="text-base font-semibold text-ink-900">Registered through the form?</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                The team reviews every response. You will hear from the host office once yours
                is confirmed.
              </p>
            </div>
          </li>
          <li className="grid grid-cols-[36px_1fr] gap-4 border-b border-border py-4">
            <span className="font-mono text-sm font-semibold text-gold-700">2</span>
            <div>
              <h2 className="text-base font-semibold text-ink-900">Your pass is issued on site</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                Passes are handed out at the arrival desk on the day. No QR code is sent by
                email before the event.
              </p>
            </div>
          </li>
          <li className="grid grid-cols-[36px_1fr] gap-4 border-b border-border py-4">
            <span className="font-mono text-sm font-semibold text-gold-700">3</span>
            <div>
              <h2 className="text-base font-semibold text-ink-900">Need an answer now?</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                Contact the host office with the email you registered with.{' '}
                <Link to="/faq" className="font-medium text-ink-900 underline underline-offset-4">
                  Contact details are on the FAQ page
                </Link>
                .
              </p>
            </div>
          </li>
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <ActionLink to="/register">
            Register interest
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ActionLink>
          <ActionLink to="/faq" variant="secondary">
            Read the FAQ
          </ActionLink>
        </div>

        <div className="mt-8">
          <PlaceholderBadge>Interim page — full status lookup ships in Stage 3</PlaceholderBadge>
        </div>
      </div>
    </>
  )
}
