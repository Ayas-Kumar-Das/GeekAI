import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Zap,
  Settings,
  Globe,
} from 'lucide-react'

const navItems = [
  { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/super-admin/events', label: 'Events', icon: Calendar },
]

export default function SuperAdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-gray-900 text-white">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5 font-bold text-xl">
            <img
              src={`${import.meta.env.BASE_URL}icons/geekai.svg`}
              alt="GeekAI Logo"
              className="h-8 w-8 object-contain rounded-md shadow-xs"
            />
            GeekAI
          </div>
          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/15 px-2 py-0.5 rounded-full">
            <Zap className="h-3 w-3" /> Super Admin
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
          <div className="text-sm text-white/80 font-medium mb-1 truncate">{user?.name}</div>
          <div className="text-xs text-yellow-400/80 mb-3">Super Admin</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <img
              src={`${import.meta.env.BASE_URL}icons/geekai.svg`}
              alt="GeekAI Logo"
              className="h-6 w-6 object-contain rounded-md shadow-xs"
            />
            GeekAI Super Admin
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
                    ? 'bg-gray-900/10 text-gray-900 font-semibold'
                    : 'text-gray-500 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Top bar */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-8 py-4 items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                <Globe className="h-3 w-3" /> GeekAI Platform
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-1 tracking-tight">
              Super Admin Console
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{user?.name}</p>
              <p className="text-xs text-yellow-600 font-medium">Super Admin • Platform Access</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
