/**
 * FactStrip — the three-fact band under the hero (§7.1 item 4, mockup 01):
 * Talks / Workshops / Demo floor, 1px rules, mono numbers, no icons.
 * These are track descriptions, not counts — no numbers are invented.
 */
const facts = [
  {
    num: '01',
    title: 'Talks',
    desc: 'Keynotes, research and public conversation.',
  },
  {
    num: '02',
    title: 'Workshops',
    desc: 'Hands-on sessions for students and builders.',
  },
  {
    num: '03',
    title: 'Demo floor',
    desc: 'Startups, labs and applied AI in the field.',
  },
]

export function FactStrip() {
  return (
    <section aria-label="What the day includes" className="border-y border-border bg-paper">
      <ul className="container-wide grid grid-cols-1 md:grid-cols-3">
        {facts.map((fact, index) => (
          <li
            key={fact.num}
            className={
              'flex items-start gap-3.5 border-border px-0 py-4 md:h-[78px] md:items-center md:py-0 ' +
              (index < facts.length - 1
                ? 'border-b md:border-b-0 md:border-r md:pl-0 md:pr-6 ' + (index > 0 ? 'md:pl-6 ' : '')
                : '')
            }
          >
            <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-gold-700">
              {fact.num}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-ink-900">{fact.title}</span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">{fact.desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FactStrip
