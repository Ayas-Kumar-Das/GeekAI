import { Link } from 'react-router-dom'
import { Brain, UserPlus, Shield, QrCode, Scan } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary-dark to-primary py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <Brain className="h-14 w-14 text-accent" />
            <h1 className="text-5xl font-extrabold text-white">GeekAI</h1>
          </div>
          <p className="text-xl text-white/80 mb-4">
            Smart Registration &amp; Attendance Management
          </p>
          <p className="text-lg text-accent font-semibold mb-8">
            Odisha AI Symposium 2026
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors shadow-lg"
            >
              <UserPlus className="h-5 w-5" /> Register Now
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors"
            >
              <Shield className="h-5 w-5" /> Staff Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={UserPlus}
              title="Register Online"
              description="Fill in your details and upload a photo. Receive a personalized QR code via email."
            />
            <FeatureCard
              icon={Scan}
              title="Face Check-in"
              description="Walk up to the camera at the venue. AI-powered facial recognition marks your arrival instantly."
            />
            <FeatureCard
              icon={QrCode}
              title="QR Session Tracking"
              description="Show your QR code at each session. Volunteers scan it on their phones to track attendance."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  )
}

