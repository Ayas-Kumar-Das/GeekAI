import { Outlet, Link, useParams } from 'react-router-dom'
import Navbar from './Navbar'
import Brand from './public/Brand'

export default function Layout({ login = false }) {
  const { eventSlug = 'oaic' } = useParams()
  return (
    <div className="public-shell min-h-dvh flex flex-col">
      <Navbar />
      <main className={login ? "login-main flex-1" : "flex-1"} id="main-content"><Outlet /></main>
      {!login && <footer className="public-footer">
        <div className="public-width footer-grid">
          <div><Brand /><p>AI-powered registration, face check-in, and real-time event analytics across India.</p></div>
          <nav aria-label="Footer navigation">
            <h2>Quick links</h2>
            <Link to="/#active-events">Active Events</Link>
            <Link to="/#host">Host an Event</Link>
            <Link to={`/events/${eventSlug}/register#recover-order`}>Recover Order ID</Link>
          </nav>
          <div>
            <h2>Contact</h2>
            <a href="mailto:info@oaic.in">info@oaic.in</a>
            <a href="mailto:info@oaic.in?subject=Terms%20and%20Privacy">Terms &amp; Privacy enquiries</a>
            <p>© 2026 GeekAI. All rights reserved.</p>
          </div>
        </div>
      </footer>}
    </div>
  )
}
