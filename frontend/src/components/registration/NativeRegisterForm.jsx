import { useState } from 'react'
import { User, Mail, Phone, Building } from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'
import Input from '../ui/Input'
import Button from '../ui/Button'
import PhotoCapture from '../ui/PhotoCapture'

const categories = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'RESEARCHER', label: 'Researcher' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'SPEAKER', label: 'Speaker' },
  { value: 'OTHER', label: 'Other' },
]

/**
 * NativeRegisterForm — the legacy POST /participants/ form, demoted to the
 * staff-assisted walk-in path (§6.1 `/register/assisted`, P0-3). The success
 * copy no longer claims a QR was emailed: passes are issued at the arrival
 * desk (§4.2 voice). Public intake is the Google Form handoff.
 */
export function NativeRegisterForm({ assisted = false }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    category: 'STUDENT',
  })
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const reset = () => {
    setSuccess(false)
    setForm({ name: '', email: '', phone: '', institution: '', category: 'STUDENT' })
    setPhoto(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!photo) {
      toast.error('Please capture or upload a photo')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('email', form.email)
      formData.append('phone', form.phone)
      formData.append('institution', form.institution)
      formData.append('category', form.category)
      formData.append('photo', photo)

      await client.post('/participants/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSuccess(true)
      toast.success('Registration recorded')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      toast.error(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-paper p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 font-mono text-xl font-bold text-gold-700">
          ✓
        </span>
        <h2 className="text-2xl font-bold text-ink-900">Registration recorded</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          Your pass is issued at the arrival desk when you arrive. No QR code is sent by
          email before the event.
          <br />
          Bring a photo ID and the email you registered with ({form.email}).
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={reset}>
            Register another participant
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-border bg-paper p-6 shadow-sm"
    >
      <Input
        label="Full Name *"
        name="name"
        icon={User}
        placeholder="Your full name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <Input
        label="Email *"
        name="email"
        type="email"
        icon={Mail}
        placeholder="your@email.com"
        value={form.email}
        onChange={handleChange}
        required
      />
      <Input
        label="Phone Number *"
        name="phone"
        type="tel"
        icon={Phone}
        placeholder="+91 98765 43210"
        value={form.phone}
        onChange={handleChange}
        required
      />
      <Input
        label="Institution *"
        name="institution"
        icon={Building}
        placeholder="Your university or organization"
        value={form.institution}
        onChange={handleChange}
        required
      />

      <div>
        <label htmlFor="native-category" className="mb-1 block text-sm font-medium text-slate-700">
          Category *
        </label>
        <select
          id="native-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className="block w-full rounded-lg border border-border-control bg-white px-3 py-2 text-sm text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/20"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700">Profile Photo *</span>
        <PhotoCapture onCapture={setPhoto} />
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {assisted ? 'Complete walk-in registration' : 'Complete Registration'}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted">
        Your photo is used for event verification only. It is not published.{' '}
        <a href="/privacy" className="underline underline-offset-2">
          Read the privacy notice
        </a>
        .
      </p>
    </form>
  )
}

export default NativeRegisterForm
