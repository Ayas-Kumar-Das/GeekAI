import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import {
  UserPlus,
  Trash2,
  Search,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react'
import { formatDate, formatShortDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export default function Volunteers() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)

  // Fetch volunteers
  const { data: volunteers, isLoading } = useQuery({
    queryKey: ['admin-volunteers'],
    queryFn: () => client.get('/admin/volunteers').then((r) => r.data),
  })

  // Create volunteer mutation
  const createMutation = useMutation({
    mutationFn: (newVolunteer) => client.post('/admin/volunteers', newVolunteer),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-volunteers'] })
      toast.success(`Volunteer "${res.data.name}" added successfully! They can now log in.`)
      closeModal()
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to add volunteer'
      toast.error(typeof msg === 'string' ? msg : 'Failed to add volunteer')
    },
  })

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: (id) => client.patch(`/admin/volunteers/${id}/toggle-status`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-volunteers'] })
      const statusText = res.data.is_active ? 'activated' : 'deactivated'
      toast.success(`Volunteer "${res.data.name}" has been ${statusText}.`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update volunteer status')
    },
  })

  // Delete volunteer mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/admin/volunteers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-volunteers'] })
      toast.success('Volunteer removed successfully.')
      setDeleteModalOpen(false)
      setSelectedVolunteer(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to remove volunteer')
    },
  })

  const openModal = () => {
    setForm(emptyForm)
    setShowPassword(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setForm(emptyForm)
    setShowPassword(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Please enter the volunteer name')
      return
    }

    if (!form.email.trim()) {
      toast.error('Please enter a valid email address')
      return
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    createMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })
  }

  const confirmDelete = (volunteer) => {
    setSelectedVolunteer(volunteer)
    setDeleteModalOpen(true)
  }

  // Filter volunteers by search query
  const filteredVolunteers = (volunteers || []).filter((v) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q)
    )
  })

  const totalVolunteers = volunteers?.length || 0
  const activeVolunteers = volunteers?.filter((v) => v.is_active).length || 0
  const totalAttendanceMarked =
    volunteers?.reduce((sum, v) => sum + (v.attendance_count || 0), 0) || 0

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Volunteer',
      render: (v, row) => (
        <div>
          <p className="font-semibold text-gray-900">{v}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (v) => (
        <Badge
          className={
            v ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
          }
        >
          {v ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'attendance_count',
      label: 'Check-ins Marked',
      render: (v) => (
        <span className="inline-flex items-center gap-1 font-medium text-gray-800">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          {v || 0}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Added Date',
      render: (v) => formatShortDate(v),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            title={row.is_active ? 'Deactivate volunteer' : 'Activate volunteer'}
            onClick={() => toggleMutation.mutate(row.id)}
            disabled={toggleMutation.isPending}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              row.is_active
                ? 'hover:bg-amber-50 text-amber-600'
                : 'hover:bg-emerald-50 text-emerald-600'
            }`}
          >
            {row.is_active ? (
              <UserX className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
          </button>
          <button
            title="Remove volunteer"
            onClick={() => confirmDelete(row)}
            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add volunteers with custom credentials so they can log in and record attendance.
          </p>
        </div>
        <Button onClick={openModal} variant="accent" className="self-start sm:self-auto">
          <UserPlus className="h-4 w-4" /> Add Volunteer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Total Volunteers" value={totalVolunteers} icon={User} />
        <Card title="Active Volunteers" value={activeVolunteers} icon={ShieldCheck} />
        <Card
          title="Total Check-ins Logged"
          value={totalAttendanceMarked}
          icon={ClipboardCheck}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search volunteers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Volunteers Table */}
      <Table
        columns={columns}
        data={filteredVolunteers}
        loading={isLoading}
        emptyMessage={
          search
            ? 'No volunteers matching your search.'
            : 'No volunteers registered yet. Click "Add Volunteer" to create one.'
        }
      />

      {/* Add Volunteer Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Add New Volunteer" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Set custom credentials for the volunteer. They will use this email and password
            to log in to the volunteer attendance portal.
          </p>

          <Input
            label="Full Name *"
            icon={User}
            placeholder="e.g. Priyadarshini Sahoo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Input
            label="Custom Email Address *"
            type="email"
            icon={Mail}
            placeholder="e.g. volunteer.priya@geekai.in"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Input
            label="Confirm Password *"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={createMutation.isPending}>
              Create Volunteer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Remove Volunteer"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove volunteer{' '}
            <strong className="text-gray-900">{selectedVolunteer?.name}</strong> (
            {selectedVolunteer?.email})?
          </p>
          <p className="text-xs text-red-600">
            This will permanently remove their access to the volunteer portal.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => selectedVolunteer && deleteMutation.mutate(selectedVolunteer.id)}
            >
              Confirm Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

