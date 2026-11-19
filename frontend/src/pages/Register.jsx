import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHero, PlaceholderBadge } from '../components/public/PageHero'
import { ActionLink } from '../components/ui/ActionLink'
import Button from '../components/ui/Button'
import Banner from '../components/ui/Banner'
import NativeRegisterForm from '../components/registration/NativeRegisterForm'
import { event } from '../content/event'
import { flags } from '../content/flags'

/** Numbered three-step explainer (§7.2) — 1px rules, no icons needed. */
const steps = [
  {
    n: '1',
    title: 'Submit the form',
    body: 'Your details, a recent photo and your consent, through the official Google Form.',
  },
  {
    n: '2',
    title: 'The team reviews your response',
    body: 'We check the photo and details you submitted so the desk can match them on arrival.',
  },
  {
    n: '3',
    title: 'Your pass is issued at the arrival desk',
    body: 'In person, on the day. No QR code is sent by email before the event.',
  },
]

const formFields = [
  'Name',
  'Email',
  'Phone',
  'Institution',
  'Category',
  'Photo',
  'Consent',
  'Accessibility needs',
]

const beforeYouStart = [
  'Use the same email you can access on event day.',
  'Have a recent photo ready.',
  'Read the privacy notice.',
]

/**
 * Register — the Google Form handoff (§7.2): "this page is not a form".
 * Explains the process, what the form asks, and hands off in one click with
 * rel="noopener noreferrer". When `flags.registrationHandoff` is off (prod
 * escape hatch), the legacy native form renders here instead.
 */
export default function Register() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  )

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  // Emergency deploy fallback: native form at /register (P0-3 end state removes it).
  if (!flags.registrationHandoff) {
    return (
      <div className="container-prose py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-700">
          Registration · AIS 2026
        </p>
        <h1 className="mt-3 text-h1 font-semibold text-ink-900">Participant registration</h1>
        <p className="mt-4 text-lead text-slate-700">
          Complete the form below with your details and a recent photo.
        </p>
        <div className="mt-8">
          <NativeRegisterForm />
        </div>
      </div>
    )
  }

  const formUrl = event.registration.formUrl
  const closed = event.registration.closed
  const ctaEnabled = Boolean(formUrl) && !closed && online

  const openForm = () => {
    toast.success('Form opened in a new tab')
  }

  return (
    <>
      <PageHero
        eyebrow="Registration · AIS 2026"
        title="Register for the symposium."
        lead="Registration is handled through the official Google Form. It takes about five minutes."
        crumbs={[
          { to: '/', label: 'Home' },
          { label: 'Register' },
        ]}
      />

      <div className="container-prose pt-8 pb-16 md:pb-24">
        {/* States (§7.2) */}
        {!online && (
          <Banner tone="offline" title="You're offline" className="mb-6">
            The registration form opens in a new tab and may need a connection. This page will
            still work when you are back online.
          </Banner>
        )}
        {!formUrl && !closed && (
          <Banner tone="info" title="Registration link will be available shortly" className="mb-6">
            The official Google Form URL has not been published yet. The host office will share
            it here as soon as registration opens.
          </Banner>
        )}
        {closed && (
          <Banner tone="warning" title="Registration closed" className="mb-6">
            Registration is closed for this event.{' '}
            <Link to="/registration/status" className="font-medium underline underline-offset-2">
              Check your registration status
            </Link>{' '}
            or contact the host office.
          </Banner>
        )}

        {/* Three-step explainer */}
        <section aria-labelledby="steps-heading" className="mt-2">
          <h2 id="steps-heading" className="text-h3 font-semibold text-ink-900">
            What happens after you submit
          </h2>
          <ol className="mt-5 border-t border-border">
            {steps.map((step) => (
              <li key={step.n} className="grid grid-cols-[36px_1fr] gap-4 border-b border-border py-4">
                <span className="font-mono text-sm font-semibold text-gold-700">{step.n}</span>
                <div>
                  <h3 className="text-base font-semibold text-ink-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* What the form asks */}
        <section aria-labelledby="asks-heading" className="mt-10">
          <h2 id="asks-heading" className="text-h3 font-semibold text-ink-900">
            What the form asks
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
            {formFields.map((field) => (
              <li key={field} className="flex items-start gap-2 text-sm text-slate-700">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                {field}
              </li>
            ))}
          </ul>
        </section>

        {/* Before you start */}
        <section aria-labelledby="before-heading" className="mt-10 rounded-lg border border-sand-200 bg-sand-100 p-5">
          <h2 id="before-heading" className="text-h4 font-semibold text-ink-900">
            Before you start
          </h2>
          <ul className="mt-3 space-y-2">
            {beforeYouStart.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#5A4D38]">
                <span aria-hidden="true" className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-600" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Primary CTA */}
        <section className="mt-10" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="sr-only">
            Open the registration form
          </h2>
          {ctaEnabled ? (
            <ActionLink
              href={formUrl}
              size="lg"
              className="w-full justify-center sm:w-auto"
              onClick={openForm}
            >
              Open the registration form
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </ActionLink>
          ) : (
            <Button size="lg" disabled className="w-full sm:w-auto">
              {closed ? 'Registration closed' : 'Open the registration form'}
            </Button>
          )}

          <div className="mt-4">
            <ActionLink to="/registration/status" variant="secondary">
              Already registered? Check status
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ActionLink>
          </div>

          <p className="mt-4 text-xs text-muted">
            Opens in a new tab · never shares your form answers on this page.
          </p>
        </section>

        {/* Assisted registration */}
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-h4 font-semibold text-ink-900">Need help?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            The host office can complete the form with you, and assisted registration is
            available at the event.{' '}
            <Link to="/faq" className="font-medium text-ink-900 underline underline-offset-4">
              Contact the host office
            </Link>
            .
          </p>
        </section>

        {/* Privacy strip */}
        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-paper p-4">
          <p className="text-sm text-slate-700">
            Your photo is used for event verification only. It is not published.
          </p>
          <Link
            to="/privacy"
            className="text-sm font-medium text-ink-900 underline underline-offset-4"
          >
            Read the privacy notice
          </Link>
        </section>

        <div className="mt-8">
          <PlaceholderBadge>Working copy — pending host approval</PlaceholderBadge>
        </div>
      </div>

      {/* Mobile sticky CTA (§7.2 mobile): 44px height */}
      {ctaEnabled && (
        <div className="sticky-cta fixed inset-x-0 bottom-0 z-30 border-t border-border bg-ivory-100/97 px-[18px] pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur-sm sm:hidden">
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={openForm}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-ink-900 text-sm font-medium text-ivory-50 transition-colors duration-fast hover:bg-ink-800"
          >
            Open the form
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      )}
      <div aria-hidden="true" className="h-16 sm:hidden" />
    </>
  )
}
