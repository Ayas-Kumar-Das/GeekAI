import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Edit2, Trash2, Eye, EyeOff, Layers, Globe, AlertCircle, UserCheck } from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'

export default function SuperAdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchEvents = () => {
    setLoading(true)
    client.get('/super-admin/events')
      .then(r => setEvents(r.data))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEvents() }, [])

  const handlePublish = async (id) => {
    try {
      await client.post(`/super-admin/events/${id}/publish`)
      toast.success('Event published!')
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to publish event')
    }
  }

  const handleDeactivate = async (id) => {
    try {
      await client.post(`/super-admin/events/${id}/deactivate`)
      toast.success('Event deactivated')
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate event')
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await client.delete(`/super-admin/events/${id}`)
      toast.success('Event deleted')
      setConfirmDelete(null)
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete event')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">Loading events…</div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Events</h2>
          <p className="text-gray-500 mt-1">{events.length} event{events.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <Link
          to="/super-admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          <PlusCircle className="h-4 w-4" /> New Event
        </Link>
      </div>

      <div className="grid gap-4">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-lg">{event.name}</h3>
                  <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{event.slug}</span>
                  {event.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                  )}
                  {event.is_published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <Globe className="h-3 w-3" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Draft</span>
                  )}
                </div>
                {event.tagline && <p className="text-sm text-gray-500 mt-1">{event.tagline}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                  <span><strong className="text-gray-700">{event.participant_count}</strong> participants</span>
                  {event.registration_fee > 0 && (
                    <span>Fee: ₹{(event.registration_fee / 100).toFixed(0)}</span>
                  )}
                  {event.venue && <span>📍 {event.venue}</span>}
                  <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    <UserCheck className="h-3 w-3 text-indigo-600" />
                    Admin: {event.admin_email ? <strong className="text-gray-800">{event.admin_email}</strong> : <span className="text-amber-600 font-medium">Unassigned</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                <Link
                  to={`/super-admin/events/${event.id}/form-builder`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-medium transition-colors"
                >
                  <Layers className="h-3.5 w-3.5" /> Form Builder
                </Link>
                <Link
                  to={`/super-admin/events/${event.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Link>
                {event.is_published ? (
                  <button
                    onClick={() => handleDeactivate(event.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <EyeOff className="h-3.5 w-3.5" /> Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => handlePublish(event.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> Publish
                  </button>
                )}
                {confirmDelete === event.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {deletingId === event.id ? 'Deleting…' : 'Confirm Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(event.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No events yet</p>
            <p className="text-sm mt-1">Create your first event to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
