import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import EventRegister from './pages/EventRegister'
import Dashboard from './pages/admin/Dashboard'
import Participants from './pages/admin/Participants'
import ParticipantDetail from './pages/admin/ParticipantDetail'
import Sessions from './pages/admin/Sessions'
import Attendance from './pages/admin/Attendance'
import Export from './pages/admin/Export'
import Volunteers from './pages/admin/Volunteers'
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard'
import FaceCheckIn from './pages/volunteer/FaceCheckIn'
import QRScanner from './pages/volunteer/QRScanner'
import ManualLookup from './pages/volunteer/ManualLookup'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events/:eventSlug/register" element={<EventRegister />} />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
