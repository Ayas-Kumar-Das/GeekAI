import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Zap, Eye, EyeOff, PlusCircle, Globe } from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/super-admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Platform Overview</h2>
          <p className="text-gray-500 mt-1">Manage all GeekAI events and their registrations</p>
        </div>
        <Link
          to="/super-admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          <PlusCircle className="h-4 w-4" /> New Event
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Events', value: stats?.total_events ?? 0, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Events', value: stats?.active_events ?? 0, icon: Eye, color: 'text-green-600 bg-green-50' },
          { label: 'Published', value: stats?.published_events ?? 0, icon: Globe, color: 'text-purple-600 bg-purple-50' },
          { label: 'Total Participants', value: stats?.total_participants ?? 0, icon: Users, color: 'text-orange-600 bg-orange-50' },
          { label: 'Event Admins', value: stats?.total_admins ?? 0, icon: Zap, color: 'text-yellow-700 bg-yellow-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Events table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">All Events</h3>
          <Link to="/super-admin/events" className="text-sm text-blue-600 hover:underline">
            Manage All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Participants</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.events?.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{event.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 bg-gray-50">{event.slug}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {event.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                      )}
                      {event.is_published ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Published</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Draft</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{event.participant_count}</td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/super-admin/events/${event.id}/edit`}
                      className="text-blue-600 hover:underline text-xs font-medium mr-3"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/super-admin/events/${event.id}/form-builder`}
                      className="text-purple-600 hover:underline text-xs font-medium"
                    >
                      Form Builder
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
