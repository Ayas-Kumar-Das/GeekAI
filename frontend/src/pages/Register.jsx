import { useState } from 'react'
import { User, Mail, Phone, Building, Tag } from 'lucide-react'
import client from '../api/client'
import toast from 'react-hot-toast'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import PhotoCapture from '../components/ui/PhotoCapture'

const categories = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'RESEARCHER', label: 'Researcher' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'SPEAKER', label: 'Speaker' },
  { value: 'OTHER', label: 'Other' },
]

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', institution: '', category: 'STUDENT',
  })
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
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
      toast.success('Registration successful!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      toast.error(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
          <p className="text-gray-500 mb-4">
            Your QR code has been sent to <strong>{form.email}</strong>.<br />
            Please present it at the event for check-in.
          </p>
          <Button variant="accent" onClick={() => { setSuccess(false); setForm({ name: '', email: '', phone: '', institution: '', category: 'STUDENT' }); setPhoto(null) }}>
            Register Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Participant Registration</h1>
        <p className="text-gray-500 mt-1">Odisha AI Symposium 2026</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo *</label>
          <PhotoCapture onCapture={setPhoto} />
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg" variant="accent">
          Complete Registration
        </Button>
      </form>
    </div>
  )
}

