import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ScanLine } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const userData = await login(email, password)
      const from = location.state?.from?.pathname
      if (from) {
        navigate(from, { replace: true })
      } else if (userData.role === 'SUPER_ADMIN') {
        navigate('/super-admin', { replace: true })
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
    <div className="login-frame">
      <Link to="/" className="login-back"><ArrowLeft size={16} aria-hidden="true" /> Back to Home</Link>
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-card-header">
          <div className="login-card-brand">
            <ScanLine size={25} strokeWidth={2.1} aria-hidden="true" />
            <span>Authorized Staff Only</span>
          </div>
          <h1 id="login-title">Organizer Login</h1>
          <p>Event Admin &amp; Check-In Volunteer Portal</p>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="organizer-email">Email</label>
            <div className="login-input">
              <Mail className="login-input-icon" size={17} aria-hidden="true" />
              <input id="organizer-email" name="email" type="email" autoComplete="username"
                placeholder="organizer@geekai.in" value={email}
                onChange={event => setEmail(event.target.value)} required />
            </div>
          </div>
          <div className="login-field">
            <label htmlFor="organizer-password">Password</label>
            <div className="login-input">
              <LockKeyhole className="login-input-icon" size={17} aria-hidden="true" />
              <input id="organizer-password" name="password" type={showPassword ? 'text' : 'password'}
                autoComplete="current-password" value={password}
                onChange={event => setPassword(event.target.value)} required />
              <button type="button" className="login-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-controls="organizer-password" onClick={() => setShowPassword(visible => !visible)}>
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <button className="public-button login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : <>Sign In to Dashboard <ArrowRight size={16} aria-hidden="true" /></>}
          </button>
        </form>
        <div className="login-card-note">
          <span>Role-based access{window.location.protocol === 'https:' && ' · Encrypted session'}</span>
          <span>Need access? <a href="mailto:info@oaic.in">info@oaic.in</a></span>
        </div>
      </section>
    </div>
  )
}
