import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Brand from './public/Brand'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuLocation, setMenuLocation] = useState(null)
  const open = menuLocation === location.key
  const close = () => setMenuLocation(null)

  return (
    <header className="public-nav" onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        close()
        document.getElementById('public-menu-toggle')?.focus()
      }
    }}>
      <nav className="public-width nav-inner" aria-label="Main navigation">
        <Brand />
        <div className="nav-controls" data-authenticated={isAuthenticated}>
          <div id="public-nav-links" className="nav-links" data-open={open}>
            {isAuthenticated ? <>
              {user?.role === 'ADMIN' && <Link to="/admin" onClick={close}>Admin</Link>}
              <Link to="/volunteer" onClick={close}>Volunteer</Link>
              <button className="public-button ghost" onClick={() => { close(); logout(); navigate('/') }}><LogOut size={16} /> Sign out</button>
            </> : <Link className="public-button ghost" to="/login" onClick={close}>Organizer Login</Link>}
          </div>
          <Link className="public-button primary nav-register" to="/#active-events" onClick={close}>Register</Link>
          {isAuthenticated && <button id="public-menu-toggle" className="icon-action nav-toggle" type="button" aria-controls="public-nav-links" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setMenuLocation(open ? null : location.key)}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>}
        </div>
      </nav>
    </header>
  )
}
