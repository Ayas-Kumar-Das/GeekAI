import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, Building, AlertCircle, ArrowLeft, Brain,
  MapPin, Calendar,
} from 'lucide-react'
import client from '../api/client'
import toast from 'react-hot-toast'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import PhotoCapture from '../components/ui/PhotoCapture'

const CATEGORIES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'RESEARCHER', label: 'Researcher' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'SPEAKER', label: 'Speaker' },
  { value: 'OTHER', label: 'Other' },
]

const OAIC_GUIDELINES = [
  'Registration is open to students, researchers, professionals, and speakers.',
  'Each participant must register with a unique email address.',
  'Upload a clear, front-facing photograph for AI-powered face recognition at check-in.',
  'The registration fee of ₹300 is non-refundable once paid.',
  'Your QR code will be emailed after successful registration — keep it handy for session entry.',
  'Sessions may have limited capacity; check-in is first-come, first-served.',
  'For queries, contact info@oaic.in.',
]

export default function EventRegister() {
  const { eventSlug } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [sessions, setSessions] = useState([])
  const [eventLoading, setEventLoading] = useState(true)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', institution: '', category: 'STUDENT',
  })
  const [photo, setPhoto] = useState(null)
  const [selectedSessions, setSelectedSessions] = useState([])
  const [photoConsent, setPhotoConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  /* ── Fetch event + sessions ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [evtRes, sessRes] = await Promise.all([
          client.get(`/events/${eventSlug}`),
          client.get(`/events/${eventSlug}/sessions`),
        ])
        setEvent(evtRes.data)
        setSessions(sessRes.data)
      } catch (err) {
        if (err.response?.status === 404) {
          navigate('/', { replace: true })
        } else {
          toast.error('Failed to load event details')
        }
      } finally {
        setEventLoading(false)
      }
    }
    load()
  }, [eventSlug, navigate])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleSession = (id) =>
    setSelectedSessions(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )

  /* ── Submit registration (after optional payment) ── */
  const submitRegistration = async (paymentOrderId = null) => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('email', form.email)
    if (form.phone) fd.append('phone', form.phone)
    if (form.institution) fd.append('institution', form.institution)
    fd.append('category', form.category)
    fd.append('photo', photo)
    if (event?.id) fd.append('event_id', String(event.id))
    if (paymentOrderId) {
      fd.append('payment_order_id', paymentOrderId)
      fd.append('payment_status', 'SUCCESS')
    }

    await client.post('/participants/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setSuccess(true)
    toast.success('Registration successful! Check your email for the QR code.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!photo) { toast.error('Please capture or upload a photo'); return }
    if (!photoConsent) { toast.error('Please consent to photo usage for face recognition'); return }

    setLoading(true)
    try {
      const paymentEnabled = event?.registration_fee > 0

      if (paymentEnabled) {
        /* Create Cashfree order */
        const orderRes = await client.post('/payments/create-order', {
          event_slug: eventSlug,
          amount: event.registration_fee,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone || '9999999999',
        })
        const { payment_session_id, order_id } = orderRes.data

        /* Load Cashfree SDK and open checkout modal */
        const { load } = await import('@cashfreepayments/cashfree-js')
        const cashfree = await load({ mode: 'sandbox' })

        await cashfree.checkout({
          paymentSessionId: payment_session_id,
          redirectTarget: '_modal',
        })

        /* Verify payment */
        const verifyRes = await client.post('/payments/verify', { order_id })
        if (verifyRes.data.paid) {
          await submitRegistration(order_id)
        } else {
          toast.error('Payment was not completed. Please try again.')
        }
      } else {
        /* Free event — register directly */
        await submitRegistration()
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      toast.error(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  /* ── Loading state ── */
  if (eventLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
          <p className="text-gray-500 mb-6">
            Your QR code has been sent to <strong>{form.email}</strong>.<br />
            Please present it at the event for check-in.
          </p>
          <Button variant="accent" onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  const feeDisplay = event?.registration_fee
    ? `₹${event.registration_fee / 100}`
    : 'Free'

  const isOaic = eventSlug === 'oaic'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </button>

      {/* Event Branding Banner */}
      {event && (
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white mb-8 text-center">
          {event.logo_url && (
            <img
              src={event.logo_url}
              alt={event.name}
              className="h-14 mx-auto mb-4 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={e => (e.target.style.display = 'none')}
            />
          )}
          {!event.logo_url && <Brain className="h-10 w-10 text-accent mx-auto mb-3" />}
          <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
          {event.tagline && <p className="text-white/80 text-sm mb-2">{event.tagline}</p>}
          <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-white/70">
            {event.venue && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
            )}
            {event.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(event.event_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
          {event.registration_fee > 0 && (
            <div className="mt-4 inline-block bg-accent/20 border border-accent/40 rounded-lg px-4 py-1.5">
              <span className="text-accent font-semibold text-sm">Registration Fee: {feeDisplay}</span>
            </div>
          )}
        </div>
      )}

      {/* OAIC Guidelines */}
      {isOaic && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Registration Guidelines
          </h3>
          <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
            {OAIC_GUIDELINES.map((g, i) => <li key={i}>{g}</li>)}
          </ol>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Personal Information</h2>

        <Input label="Full Name *" name="name" icon={User} placeholder="Your full name" value={form.name} onChange={handleChange} required />
        <Input label="Email *" name="email" type="email" icon={Mail} placeholder="your@email.com" value={form.email} onChange={handleChange} required />
        <Input label="Phone Number *" name="phone" type="tel" icon={Phone} placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} required />
        <Input label="Institution *" name="institution" icon={Building} placeholder="Your university or organisation" value={form.institution} onChange={handleChange} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Session Selection */}
        {sessions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sessions to Attend <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="space-y-2">
              {sessions.map(s => (
                <label
                  key={s.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(s.id)}
                    onChange={() => toggleSession(s.id)}
                    className="mt-0.5 h-4 w-4 text-primary rounded border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    {s.location && (
                      <span className="text-xs text-gray-500 ml-2">@ {s.location}</span>
                    )}
                    {s.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo *</label>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-800 leading-relaxed">
            <strong>📸 Why do we need your photo?</strong> Your photograph will be used exclusively
            for AI-powered face recognition at the event venue. This enables quick, contactless
            check-in without queues. Photos are stored securely and never shared with third parties.
          </div>
          <PhotoCapture onCapture={setPhoto} />
        </div>

        {/* Photo Consent */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={photoConsent}
            onChange={e => setPhotoConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary rounded border-gray-300 cursor-pointer"
          />
          <span className="text-sm text-gray-600">
            I consent to my photograph being used for AI-powered face recognition check-in at the
            event venue. I understand this is required for entry and my photo will be stored securely.
          </span>
        </label>

        <Button type="submit" loading={loading} className="w-full" size="lg" variant="accent">
          {event?.registration_fee > 0
            ? `Pay ${feeDisplay} & Register`
            : 'Complete Registration'}
        </Button>
      </form>
    </div>
  )
}
