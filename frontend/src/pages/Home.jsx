import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, UserPlus, Scan, QrCode, BarChart3,
  Building2, Calendar, MapPin, ArrowRight, Mail, Shield
} from 'lucide-react'
import client from '../api/client'

const INSTITUTIONS = [
  { name: 'IIT Bhubaneswar', abbr: 'IIT' },
  { name: 'NIT Rourkela', abbr: 'NIT' },
  { name: 'KIIT University', abbr: 'KI' },
  { name: 'SOA University', abbr: 'SO' },
  { name: 'OUTR', abbr: 'OU' },
  { name: 'Utkal University', abbr: 'UU' },
  { name: 'Berhampur University', abbr: 'BU' },
  { name: 'Sambalpur University', abbr: 'SU' },
]

export default function Home() {
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    client.get('/events/')
      .then(res => setEvents(res.data))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-primary via-primary-dark to-primary py-24 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 20%, #10b981 0%, transparent 40%)',
          }}
        />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <Brain className="h-16 w-16 text-accent" />
            <h1 className="text-6xl font-extrabold text-white tracking-tight">GeekAI</h1>
          </div>
          <p className="text-2xl text-white/90 font-semibold mb-3">Powering Next-Gen Events</p>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
            AI-powered event registration, smart face check-in, and real-time attendance
            management — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#events"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors shadow-lg"
            >
              <Calendar className="h-5 w-5" /> Explore Events
            </a>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors"
            >
              <Shield className="h-5 w-5" /> Event Operator Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What We Do</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              GeekAI provides end-to-end event management technology to institutions and
              organisations across India.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            <ServiceCard icon={UserPlus} title="Smart Registration" description="Seamless online registration with photo upload, QR code generation, and email confirmation." />
            <ServiceCard icon={Scan} title="AI Face Check-In" description="Walk-up face recognition powered by InsightFace for instant, contactless event entry." />
            <ServiceCard icon={QrCode} title="Session Tracking" description="Per-session attendance using QR codes scanned by volunteers on any device." />
            <ServiceCard icon={BarChart3} title="Live Analytics" description="Real-time dashboards, attendance stats, and CSV exports for event operators." />
          </div>
        </div>
      </section>

      {/* ── Institution Logos Carousel ── */}
      <section className="py-14 bg-gray-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 mb-8 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Trusted by Leading Institutions
          </p>
        </div>
        <div className="flex gap-8" style={{ width: 'max-content', animation: 'logoScroll 30s linear infinite' }}>
          {[...INSTITUTIONS, ...INSTITUTIONS, ...INSTITUTIONS].map((inst, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center gap-3 bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100"
              style={{ filter: 'grayscale(1)', opacity: 0.6, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'grayscale(0)'; e.currentTarget.style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'grayscale(1)'; e.currentTarget.style.opacity = '0.6' }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {inst.abbr}
              </div>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{inst.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Active Events ── */}
      <section id="events" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Active Events</h2>
            <p className="text-gray-500">Register for upcoming events powered by GeekAI</p>
          </div>

          {eventsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No active events at the moment. Check back soon!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Host Your Event CTA ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-3xl mx-auto text-center">
          <Building2 className="h-14 w-14 text-accent mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Host Your Event with GeekAI</h2>
          <p className="text-white/80 mb-8 text-lg">
            Planning a conference, symposium, or workshop? Let GeekAI handle registration,
            check-in, and attendance — so you can focus on the experience.
          </p>
          <a
            href="mailto:hello@geekai.in"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors shadow-lg"
          >
            <Mail className="h-5 w-5" /> Get in Touch
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-accent" />
          <span className="text-white font-bold">GeekAI</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} GeekAI. Powering Next-Gen Events.</p>
      </footer>
    </div>
  )
}

function ServiceCard({ icon: Icon, title, description }) {
  return (
    <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  )
}

function EventCard({ event }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }
  const formatFee = (paise) => {
    if (!paise) return 'Free'
    return `₹${paise / 100}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      <div className="bg-gradient-to-br from-primary to-primary-dark h-24 flex items-center justify-center px-4">
        {event.logo_url ? (
          <img
            src={event.logo_url}
            alt={event.name}
            className="max-h-16 max-w-full object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <Brain className="h-10 w-10 text-white/80" />
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-lg mb-1">{event.name}</h3>
        {event.tagline && (
          <p className="text-accent text-sm font-medium mb-3">{event.tagline}</p>
        )}
        {event.venue && (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{event.venue}</span>
          </div>
        )}
        {event.event_date && (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDate(event.event_date)}</span>
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-primary font-semibold">{formatFee(event.registration_fee)}</span>
          <Link
            to={`/events/${event.slug}/register`}
            className="inline-flex items-center gap-1 bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Register <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
