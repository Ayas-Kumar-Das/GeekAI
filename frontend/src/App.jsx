import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import RouteFallback from './components/RouteFallback'

// Route-level code splitting (§10.2): public, staff, volunteer and admin
// chunks load separately; html5-qrcode stays out of every other bundle.
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Participants = lazy(() => import('./pages/admin/Participants'))
const ParticipantDetail = lazy(() => import('./pages/admin/ParticipantDetail'))
const Sessions = lazy(() => import('./pages/admin/Sessions'))
const Attendance = lazy(() => import('./pages/admin/Attendance'))
const Export = lazy(() => import('./pages/admin/Export'))
const Volunteers = lazy(() => import('./pages/admin/Volunteers'))
const VolunteerDashboard = lazy(() => import('./pages/volunteer/VolunteerDashboard'))
const FaceCheckIn = lazy(() => import('./pages/volunteer/FaceCheckIn'))
const QRScanner = lazy(() => import('./pages/volunteer/QRScanner'))
const ManualLookup = lazy(() => import('./pages/volunteer/ManualLookup'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Forbidden = lazy(() => import('./pages/Forbidden'))
const ServerError = lazy(() => import('./pages/ServerError'))
const Offline = lazy(() => import('./pages/Offline'))

export default function App() {
  const location = useLocation()

  return (
    <ErrorBoundary resetKeys={[location.pathname]}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/volunteer/login" element={<Login />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="participants" element={<Participants />} />
            <Route path="participants/:id" element={<ParticipantDetail />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="volunteers" element={<Volunteers />} />
            <Route path="export" element={<Export />} />
          </Route>

          {/* Volunteer routes */}
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'VOLUNTEER']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VolunteerDashboard />} />
            <Route path="face-checkin" element={<FaceCheckIn />} />
            <Route path="scan" element={<QRScanner />} />
            <Route path="manual" element={<ManualLookup />} />
          </Route>

          {/* Global states (§7.9) */}
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="/offline" element={<Offline />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
