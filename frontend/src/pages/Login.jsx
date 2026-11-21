import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brain, Mail, Lock } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const userData = await login(email, password)
      // Prefer the location ProtectedRoute stored, then ?returnTo= from a
      // session expiry, then the role home (§6.6).
      const returnTo = new URLSearchParams(location.search).get('returnTo')
      const from = location.state?.from
      if (from?.pathname) {
        navigate(`${from.pathname}${from.search ?? ''}`, { replace: true })
      } else if (returnTo && returnTo.startsWith('/')) {
        navigate(returnTo, { replace: true })
      } else if (userData.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/volunteer', { replace: true })
      }
    } catch {
      // Error handled in AuthContext
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Brain className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
          <p className="text-gray-500 mt-1">Admin &amp; Volunteer Access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}

