import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import Table from '../../components/ui/Table'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { getMethodBadge, formatDate } from '../../utils/helpers'

export default function Attendance() {
  const [tab, setTab] = useState('event')
  const [selectedSession, setSelectedSession] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: () => client.get('/attendance/stats').then((r) => r.data),
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => client.get('/sessions/').then((r) => r.data),
  })

  const { data: eventAttendance, isLoading: eventLoading } = useQuery({
    queryKey: ['event-attendance'],
    queryFn: () => client.get('/attendance/event').then((r) => r.data),
    enabled: tab === 'event',
  })

  const { data: sessionAttendance, isLoading: sessionLoading } = useQuery({
    queryKey: ['session-attendance', selectedSession],
    queryFn: () => client.get(`/attendance/session/${selectedSession}`).then((r) => r.data),
    enabled: tab === 'session' && !!selectedSession,
  })

  const columns = [
    { key: 'participant_name', label: 'Participant', render: (v) => v || '—' },
    { key: 'method', label: 'Method', render: (v) => <Badge className={getMethodBadge(v)}>{v}</Badge> },
    { key: 'marked_at', label: 'Marked At', render: (v) => formatDate(v) },
  ]

  if (tab === 'session') {
    columns.splice(1, 0, { key: 'session_name', label: 'Session', render: (v) => v || '—' })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance Monitoring</h1>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card title="Total Participants" value={stats.total_participants} />
          <Card title="Checked In" value={stats.total_checked_in} />
          <Card title="Sessions" value={stats.total_sessions} />
          <Card title="By Method">
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(stats.attendance_by_method || {}).map(([m, c]) => (
                <div key={m} className="flex items-center gap-1">
                  <Badge className={getMethodBadge(m)}>{m}</Badge>
                  <span className="text-sm font-semibold">{c}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('event')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'event' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Event Check-ins
        </button>
        <button
          onClick={() => setTab('session')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'session' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Session Attendance
        </button>
      </div>

      {/* Content */}
      {tab === 'event' && (
        <Table columns={columns} data={eventAttendance || []} loading={eventLoading} emptyMessage="No event check-ins recorded yet" />
      )}

      {tab === 'session' && (
        <div className="space-y-4">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-72"
          >
            <option value="">Select a session...</option>
            {sessions?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {selectedSession ? (
            <Table columns={columns} data={sessionAttendance || []} loading={sessionLoading} emptyMessage="No attendance for this session" />
          ) : (
            <p className="text-gray-400 text-sm">Select a session to view attendance</p>
          )}

          {/* Per-session summary */}
          {stats?.attendance_by_session?.length > 0 && (
            <Card title="Session Summary">
              <div className="mt-3 divide-y divide-gray-100">
                {stats.attendance_by_session.map((s) => (
                  <div key={s.session_id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-700">{s.session_name}</span>
                    <span className="text-sm font-bold text-primary">{s.count} attendees</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

