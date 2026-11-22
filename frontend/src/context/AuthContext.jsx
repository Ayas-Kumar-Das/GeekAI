import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await client.post('/auth/login', { email, password })
      const { access_token, role, name, event_id, event_name, event_slug } = data
      const userData = { role, name, event_id, event_name, event_slug }
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(access_token)
      setUser(userData)
      toast.success(`Welcome back, ${name}!`)
      return userData
    } catch (error) {
      const msg = error.response?.data?.detail || 'Login failed'
      toast.error(typeof msg === 'string' ? msg : 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role === 'ADMIN'
  const isVolunteer = user?.role === 'VOLUNTEER'

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, isAuthenticated, isAdmin, isVolunteer }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
