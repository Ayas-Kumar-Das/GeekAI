import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name: '', slug: '', description: '', tagline: '',
  logo_url: '', banner_url: '', registration_fee: 0,
  venue: '', website: '',
  event_date: '', registration_deadline: '',
}

function toLocalDatetime(iso) {
  if (!iso) return ''
  return iso.slice(0, 16) // "2026-03-20T09:00"
}

function toISO(local) {
  if (!local) return null
  return new Date(local).toISOString()
}

export default function EventEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [slugDirty, setSlugDirty] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    client.get(`/super-admin/events/${id}`)
      .then(r => {
        const e = r.data
        setForm({
          name: e.name || '',
          slug: e.slug || '',
          description: e.description || '',
          tagline: e.tagline || '',
          logo_url: e.logo_url || '',
          banner_url: e.banner_url || '',
          registration_fee: e.registration_fee || 0,
          venue: e.venue || '',
          website: e.website || '',
          event_date: toLocalDatetime(e.event_date),
          registration_deadline: toLocalDatetime(e.registration_deadline),
        })
        setSlugDirty(true)
      })
      .catch(() => toast.error('Failed to load event'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'name' && !slugDirty && !isEdit) {
      setForm(f => ({
        ...f,
        name: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }))
    } else if (name === 'slug') {
      setSlugDirty(true)
      setForm(f => ({ ...f, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        registration_fee: parseInt(form.registration_fee) || 0,
        event_date: toISO(form.event_date),
        registration_deadline: toISO(form.registration_deadline),
      }
      // Remove empty strings → null
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null
      })

      if (isEdit) {
        await client.patch(`/super-admin/events/${id}`, payload)
        toast.success('Event updated!')
      } else {
        const r = await client.post('/super-admin/events', payload)
        toast.success('Event created!')
        navigate(`/super-admin/events/${r.data.id}/edit`, { replace: true })
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">Loading event…</div>
  )

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/super-admin/events" className="text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          <p className="text-gray-500 text-sm mt-0.5">Configure event details and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
            <input
              name="name" value={form.name} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="Odisha AI Conference 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/events/</span>
              <input
                name="slug" value={form.slug} onChange={handleChange} required
                pattern="[a-z0-9-]+" title="Only lowercase letters, numbers and hyphens"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                placeholder="oaic"
                disabled={isEdit}
              />
            </div>
            {isEdit && <p className="text-xs text-gray-400 mt-1">Slug cannot be changed after creation.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
            <input
              name="tagline" value={form.tagline} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="Short, catchy tagline for the event"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
              placeholder="Full event description…"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Logistics</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
              <input
                name="event_date" type="datetime-local" value={form.event_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
              <input
                name="registration_deadline" type="datetime-local" value={form.registration_deadline} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input
              name="venue" value={form.venue} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="KIIT University, Bhubaneswar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (in Paise)</label>
            <div className="flex items-center gap-2">
              <input
                name="registration_fee" type="number" min="0" value={form.registration_fee} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                placeholder="30000"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">
                = ₹{(parseInt(form.registration_fee) / 100 || 0).toFixed(0)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Enter 0 for free events. 30000 = ₹300</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Website</label>
            <input
              name="website" type="url" value={form.website} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="https://oaic.in"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Branding</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              name="logo_url" value={form.logo_url} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner URL</label>
            <input
              name="banner_url" value={form.banner_url} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="https://…"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
          </button>
          {isEdit && (
            <Link
              to={`/super-admin/events/${id}/form-builder`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Configure Form Builder →
            </Link>
          )}
          <Link to="/super-admin/events" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
