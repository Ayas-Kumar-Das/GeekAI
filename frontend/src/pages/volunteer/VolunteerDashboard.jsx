import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { QrCode, Search, ClipboardCheck } from 'lucide-react'
import Card from '../../components/ui/Card'

export default function VolunteerDashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Panel</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.name}!</p>
      </div>

      <div className="grid gap-4">
        <Link to="/volunteer/scan">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-accent/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-xl">
                <QrCode className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
                <p className="text-sm text-gray-500">
                  Scan participant QR codes to mark session attendance
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/volunteer/manual">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manual Lookup</h3>
                <p className="text-sm text-gray-500">
                  Search for a participant by name or ID and mark attendance manually
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

