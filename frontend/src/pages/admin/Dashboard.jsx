import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { Users, CalendarDays, ClipboardCheck, DoorOpen } from 'lucide-react'
import { getCategoryColor, timeAgo } from '../../utils/helpers'

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => client.get('/admin/dashboard').then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  const stats = data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Participants" value={stats?.total_participants ?? 0} icon={Users} />
        <Card title="Event Check-ins" value={stats?.event_checkins ?? 0} icon={DoorOpen} />
        <Card title="Sessions" value={stats?.total_sessions ?? 0} icon={CalendarDays} />
        <Card title="Attendance Records" value={stats?.total_attendance_records ?? 0} icon={ClipboardCheck} />
      </div>

      {/* Category breakdown */}
      <Card title="Participants by Category">
        <div className="flex flex-wrap gap-3 mt-3">
          {stats?.participants_by_category &&
            Object.entries(stats.participants_by_category).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2">
                <Badge className={getCategoryColor(cat)}>{cat}</Badge>
                <span className="text-sm font-semibold text-gray-700">{count}</span>
              </div>
            ))}
          {(!stats?.participants_by_category || Object.keys(stats.participants_by_category).length === 0) && (
            <p className="text-sm text-gray-400">No participants registered yet</p>
          )}
        </div>
      </Card>

      {/* Recent registrations */}
      <Card title="Recent Registrations">
        <div className="mt-3 divide-y divide-gray-100">
          {stats?.recent_registrations?.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.email} · {p.institution}</p>
              </div>
              <div className="text-right">
                <Badge className={getCategoryColor(p.category)}>{p.category}</Badge>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(p.registered_at)}</p>
              </div>
            </div>
          ))}
          {(!stats?.recent_registrations || stats.recent_registrations.length === 0) && (
            <p className="text-sm text-gray-400 py-4">No registrations yet</p>
          )}
        </div>
      </Card>
    </div>
  )
}

