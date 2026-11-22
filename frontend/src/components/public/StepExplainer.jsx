import { ClipboardCheck, ScanFace, LayoutDashboard, DoorOpen } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * StepExplainer — the 4-step journey (§7.1 "how it works", mockup 02):
 * Register → Complete profile → Watch approval → Check in on site.
 * Copy follows §4.2 voice: passes are issued at arrival, never emailed.
 */
const steps = [
  {
    step: 'Step 1',
    title: 'Register',
    body: 'Complete the registration form on this site with your details, a recent photo and your consent.',
    icon: ClipboardCheck,
  },
  {
    step: 'Step 2',
    title: 'Complete your profile',
    body: 'We check the photo and details you submitted so the desk can match them on arrival.',
    icon: ScanFace,
  },
  {
    step: 'Step 3',
    title: 'Watch for approval',
    body: 'The event team reviews each response. The GeekAI portal keeps your status up to date.',
    icon: LayoutDashboard,
  },
  {
    step: 'Step 4',
    title: 'Check in on site',
    body: 'Your pass is issued at the arrival desk. Bring a photo ID and your registration email.',
    icon: DoorOpen,
  },
]

export function StepExplainer() {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.step} className="relative">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-sm',
                  'bg-ivory-100 text-gold-700 ring-1 ring-sand-200'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {item.step}
              </span>
            </div>
            <h3 className="mt-4 text-h4 font-semibold text-ink-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>
          </li>
        )
      })}
    </ol>
  )
}

export default StepExplainer
