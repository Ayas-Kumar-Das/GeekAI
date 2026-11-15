import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  Download,
  LogOut,
  Brain,
  ChevronLeft,
} from 'lucide-react'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/participants', label: 'Participants', icon: Users },
  { to: '/admin/sessions', label: 'Sessions', icon: CalendarDays },
  { to: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/admin/export', label: 'Export Data', icon: Download },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-primary text-white">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Brain className="h-7 w-7 text-accent" />
            GeekAI Admin
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-white/60 mb-2">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-primary text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Brain className="h-6 w-6 text-accent" />
            GeekAI Admin
          </div>
          <button onClick={handleLogout} className="text-white/60 hover:text-white cursor-pointer">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile nav */}
        <nav className="lg:hidden bg-white border-b border-gray-200 px-2 py-1 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-500 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

