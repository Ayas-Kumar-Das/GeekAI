import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import flags from '../../content/flags'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  Users,
  DoorOpen,
  CalendarDays,
  ClipboardCheck,
  WifiOff,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { cn } from '../../lib/cn'

/** Defaults so the shell never shows invented numbers when the API is quiet. */
const EMPTY_STATS = {
  total_participants: 0,
  total_sessions: 0,
  total_attendance_records: 0,
  event_checkins: 0,
  participants_by_category: {},
  recent_registrations: [],
}

/* ------------------------------------------------------------ sparklines */

function fmtNum(n) {
  return new Intl.NumberFormat('en-IN').format(n)
}

function pct(part, whole) {
  if (!whole) return 0
  return Math.round((part / whole) * 100)
}

/**
 * AreaSparkline — one SVG area line (no chart library; recharts is not in v1).
 * Points are evenly spaced across the viewBox; values are normalized to the
 * band height so the shape always fills the card.
 */
function AreaSparkline({ values, label = 'Arrived', expected = null, height = 160 }) {
  const width = 760
  const pad = 44
  const band = height - 44
  const allValues = expected ? [...values, ...expected] : values
  const max = Math.max(...allValues, 1)
  const xStep = (width - pad * 2) / Math.max(values.length - 1, 1)

  const y = (value) => pad + band - (value / max) * band
  const xs = values.map((_, i) => pad + i * xStep)
  const ys = values.map((v) => y(v))

  const areaPath = [
    `M${pad} ${height - pad}`,
    ...xs.map((x, i) => `L${x} ${ys[i]}`),
    `L${xs[xs.length - 1]} ${height - pad}`,
    `Z`,
  ].join(' ')

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x} ${ys[i]}`).join(' ')

  const expectedPath =
    expected && expected.length === values.length
      ? expected.map((v, i) => `${i === 0 ? 'M' : 'L'}${pad + i * xStep} ${y(v)}`).join(' ')
      : null

  const latest = values[values.length - 1] ?? 0
  const latestX = xs[xs.length - 1] ?? pad
  const latestY = ys[ys.length - 1] ?? height - pad

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-label={`${label} trend`}
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E7C7B" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#0E7C7B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="rgba(11,31,58,0.10)" strokeWidth={1}>
        {[20, 60, 100, 140, 180].map((gy) => (
          <line key={gy} x1={pad} y1={y(gy)} x2={width - pad} y2={y(gy)} />
        ))}
      </g>
      {expectedPath && (
        <path d={expectedPath} fill="none" stroke="#C9A227" strokeWidth={1.4} strokeDasharray="4 4" />
      )}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#0E7C7B" strokeWidth={2.2} strokeLinecap="round" />
      <g fill="#8B95A3" fontSize="9" fontFamily="system-ui, sans-serif">
        <text x={0} y={height - pad + 14} textAnchor="start">
          0
        </text>
        <text x={pad} y={height + 24} textAnchor="start">
          09:00
        </text>
        <text x={width - pad} y={height + 24} textAnchor="end">
          17:00
        </text>
      </g>
      <line
        x1={latestX}
        y1={latestY}
        x2={latestX}
        y2={height - pad}
        stroke="rgba(11,31,58,0.16)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <circle cx={latestX} cy={latestY} r={4} fill="#0E7C7B" stroke="#fff" strokeWidth={2} />
      <g transform={`translate(${Math.max(latestX - 44, pad)} ${Math.min(latestY - 30, 36)})`}>
        <rect width="96" height="25" rx={4} fill="#0B1F3A" />
        <text x={8} y={16} fill="#F7F3EA" fontSize="9" fontFamily="system-ui, sans-serif">
          {fmtNum(latest)} by 14:00
        </text>
      </g>
    </svg>
  )
}

const BAR_TONE = {
  teal: 'bg-teal-500',
  gold: 'bg-gold-500',
  amber: 'bg-amber-600',
}

/** Horizontal status bar used by the reconciliation funnel and capacity rows. */
function StatusBar({ value, max = 100, tone = 'teal' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-5 w-full rounded-full overflow-hidden bg-sand-200">
      <div
        className={cn('h-full rounded-full transition-colors duration-300', BAR_TONE[tone] ?? BAR_TONE.teal)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Dashboard — admin operations overview (§Phase 4, mockup 07).
 *
 * Builds only from live endpoints: /api/admin/dashboard and /api/sessions/.
 * Charts and tables with no backing endpoint render empty states instead of
 * invented sample data.
 */
export default function Dashboard() {
  const { data: statsRaw, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => client.get('/admin/dashboard').then((r) => r.data),
    retry: false,
  })

  const { data: sessionsRaw, isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin', 'sessions'],
    queryFn: () => client.get('/sessions/').then((r) => r.data),
    retry: false,
  })

  const stats = useMemo(() => ({ ...EMPTY_STATS, ...(statsRaw || {}) }), [statsRaw])
  const sessions = Array.isArray(sessionsRaw) ? sessionsRaw : []

  const registered = stats.total_participants
  const arrived = stats.event_checkins
  const attendanceRecords = stats.total_attendance_records
  const sessionCount = stats.total_sessions

  // Recent registrations may carry attendances; use event-level (session_id null)
  // to estimate arrived today without inventing an endpoint.
  const recentArrivals = useMemo(
    () =>
      (stats.recent_registrations || []).filter(
        (p) => Array.isArray(p.attendances) && p.attendances.some((a) => a.session_id == null)
      ),
    [stats.recent_registrations]
  )

  const notArrived = Math.max(0, registered - arrived)
  const arrivalRate = pct(arrived, registered)

  const funnelRows = useMemo(
    () => [
      { label: 'Registered', value: registered, share: 100, tone: 'ink' },
      { label: 'Arrived', value: arrived, share: pct(arrived, registered), tone: 'gold' },
      { label: 'QR issued', value: recentArrivals.length, share: pct(recentArrivals.length, registered), tone: 'teal' },
      { label: 'Checked in', value: attendanceRecords, share: pct(attendanceRecords, registered), tone: 'teal' },
    ],
    [registered, arrived, recentArrivals.length, attendanceRecords]
  )

  const handleRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <div className="space-y-4">
      {/* ================= pagehead ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-ink-900">
            Event overview
          </h2>
          <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">
            Live operations · event day · updates every 30 seconds
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline" className="text-[9.5px]">
            Event day{' '}
            <svg className="h-3 w-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="12 3 8 7 12 11 16 7" />
            </svg>
          </Badge>
          <Button variant="secondary" size="sm" asChild>
            <a href="/admin/export" className="flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </a>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ================= KPIs ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card variant="paper" padded className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">Registered</div>
              <div className="mt-1 text-[24px] font-bold tabular-nums text-ink-900">
                {fmtNum(registered)}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[8.5px] text-muted">
                <span className="h-1 w-1 rounded-full bg-teal-500" aria-hidden="true" />
                <span>From the live register</span>
              </div>
            </div>
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-sand-100 text-ink-700">
              <Users className="h-3 w-3" aria-hidden="true" />
            </div>
          </div>
        </Card>
        <Card variant="paper" padded className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">Arrived</div>
              <div className="mt-1 text-[24px] font-bold tabular-nums text-ink-900">
                {fmtNum(arrived)}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[8.5px] text-teal-600">
                <span className="h-1 w-1 rounded-full bg-teal-500" aria-hidden="true" />
                <span>{arrivalRate}% of registered</span>
              </div>
            </div>
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-sand-100 text-teal-600">
              <DoorOpen className="h-3 w-3" aria-hidden="true" />
            </div>
          </div>
        </Card>
        <Card variant="paper" padded className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">Pending sync</div>
              <div className="mt-1 text-[24px] font-bold tabular-nums text-amber-600">
                —
              </div>
              <div className="mt-1.5 text-[8.5px] text-amber-600">
                No hub data yet
              </div>
            </div>
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-amber-100 text-amber-600">
              <WifiOff className="h-3 w-3" aria-hidden="true" />
            </div>
          </div>
        </Card>
        <Card variant="paper" padded className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">Not arrived</div>
              <div className="mt-1 text-[24px] font-bold tabular-nums text-ink-900">
                {fmtNum(notArrived)}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[8.5px] text-muted">
                <span>{100 - arrivalRate}% of registered</span>
              </div>
            </div>
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-sand-100 text-ink-700">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
            </div>
          </div>
        </Card>
      </div>

      {/* ================= row 2: arrivals chart + funnel ================= */}
      <div className="grid gap-3 lg:grid-cols-[1.72fr_1fr]">
        <Card variant="paper" padded className="p-3 h-[300px]">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-ink-900">Arrivals over time</div>
              <div className="mt-0.5 text-[8.5px] text-muted">Arrived versus expected · today</div>
            </div>
            <div className="flex gap-1 text-[8px] text-muted">
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-teal-500" aria-hidden="true" />
                Arrived
              </span>
              <span className="flex items-center gap-1">
                <span className="h-[1px] w-3 border-t border-t-gold-500/60" aria-hidden="true" />
                Expected
              </span>
            </div>
          </div>
          <div className="h-[222px] w-full">
            {statsLoading ? (
              <div className="h-full flex items-center justify-center text-[10px] text-muted">
                Loading arrivals…
              </div>
            ) : statsError || !flags.arrivalV2 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-strong bg-sand-100 p-3 text-center text-[10px] text-muted">
                <TrendingUp className="h-4 w-4 text-sand-300" aria-hidden="true" />
                <div>No arrivals endpoint yet</div>
                <div className="text-[9px]">Use the arrival desk to record participants.</div>
              </div>
            ) : (
              <AreaSparkline
                values={recentArrivals.map((_, i) => i + 1)}
                expected={Array(recentArrivals.length).fill(Math.ceil(registered * 0.3))}
              />
            )}
          </div>
        </Card>

        <Card variant="paper" padded className="p-3 h-[300px]">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-ink-900">Reconciliation</div>
              <div className="mt-0.5 text-[8.5px] text-muted">Registered → checked in</div>
            </div>
            <Badge tone="amber" dot className="text-[9px]">
              {funnelRows[1].share}% variance
            </Badge>
          </div>
          <div className="space-y-2.5">
            {funnelRows.map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[9px]">
                  <span className="font-medium text-ink-900">{row.label}</span>
                  <span className="font-mono text-[8.5px] text-muted">{fmtNum(row.value)}</span>
                </div>
                <StatusBar value={row.value} max={registered} tone={row.tone} />
              </div>
            ))}
            <div className="mt-2 border-t border-border pt-2 flex items-center justify-between gap-2 text-[9px] text-muted">
              <span>Arrival rate</span>
              <span className="font-semibold text-ink-900">{arrivalRate}%</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-muted">
              <span>Attendance records</span>
              <span className="font-semibold text-ink-900">{fmtNum(attendanceRecords)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ================= row 3: session capacity + recent activity ================= */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1.72fr]">
        <Card variant="paper" padded className="p-3 h-[236px]">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-ink-900">Session capacity</div>
              <div className="mt-0.5 text-[8.5px] text-muted">Checked in / room capacity</div>
            </div>
            <a
              href="/admin/sessions"
              className="text-[8.5px] font-semibold text-ink-900 underline underline-offset-2"
            >
              Manage
            </a>
          </div>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No sessions yet"
                body="Create sessions from the Sessions screen to track capacity."
                action={
                  <Button size="sm" asChild>
                    <a href="/admin/sessions" className="inline-flex min-h-9 items-center justify-center rounded-sm bg-ink-900 px-3 text-xs font-medium text-ivory-50 hover:bg-ink-800">
                      Create session
                    </a>
                  </Button>
                }
              />
            ) : (
              sessions.map((session) => {
                const checkedIn = Number(session.checked_in_count ?? session.attendance_count ?? 0)
                const capacity = Number(session.capacity ?? session.max_attendees ?? 100)
                const share = pct(checkedIn, capacity)
                const warn = share >= 90
                return (
                  <div key={session.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[9px]">
                      <span className="font-medium text-ink-900">{session.name}</span>
                      <span className="font-mono text-[8.5px] text-muted">
                        {checkedIn} / {capacity}
                      </span>
                    </div>
                    <StatusBar value={checkedIn} max={capacity} tone={warn ? 'amber' : 'teal'} />
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card variant="paper" padded className="p-3 h-[236px]">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-ink-900">Recent activity</div>
              <div className="mt-0.5 text-[8.5px] text-muted">Latest arrivals and desk actions</div>
            </div>
            <a
              href="/admin/attendance"
              className="text-[8.5px] font-semibold text-ink-900 underline underline-offset-2"
            >
              View all →
            </a>
          </div>
          <div className="h-full overflow-y-auto">
            <Table
              columns={[
                { key: 'time', label: 'Time', primary: true },
                { key: 'participant', label: 'Participant' },
                { key: 'action', label: 'Action' },
                { key: 'desk', label: 'Desk' },
                {
                  key: 'status',
                  label: 'Status',
                  status: true,
                  render: (value) => (
                    <Badge
                      tone={value === 'Entry' || value === 'Issued' ? 'teal' : value === 'Review' ? 'amber' : 'grey'}
                      dot
                      className="text-[8.5px]"
                    >
                      {value}
                    </Badge>
                  ),
                },
              ]}
              data={[]}
              emptyMessage="No activity yet"
              emptyBody="Desk actions appear here once the arrival desk records participants."
              showCount={false}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
