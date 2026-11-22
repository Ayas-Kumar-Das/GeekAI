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
  Tag,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Percent,
  Copy,
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const emptyForm = {
  code: '',
  description: '',
  max_uses: 1,
}

export default function Coupons() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)

  // Fetch coupons
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => client.get('/admin/coupons').then((r) => r.data),
  })

  // Create coupon mutation
  const createMutation = useMutation({
    mutationFn: (newCoupon) => client.post('/admin/coupons', newCoupon),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success(`Coupon code "${res.data.code}" created successfully!`)
      closeModal()
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to create coupon'
      toast.error(typeof msg === 'string' ? msg : 'Failed to create coupon')
    },
  })

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: (id) => client.patch(`/admin/coupons/${id}/toggle-status`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      const statusText = res.data.is_active ? 'activated' : 'deactivated'
      toast.success(`Coupon "${res.data.code}" ${statusText}`)
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to update status'
      toast.error(typeof msg === 'string' ? msg : 'Failed to update status')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Coupon deleted successfully')
      setDeleteModalOpen(false)
      setSelectedCoupon(null)
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to delete coupon'
      toast.error(typeof msg === 'string' ? msg : 'Failed to delete coupon')
    },
  })

  const closeModal = () => {
    setModalOpen(false)
    setForm(emptyForm)
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.code.trim()) {
      toast.error('Coupon code is required')
      return
    }
    const maxUses = parseInt(form.max_uses, 10)
    if (isNaN(maxUses) || maxUses < 1) {
      toast.error('Max uses must be at least 1')
      return
    }

    createMutation.mutate({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      max_uses: maxUses,
      is_active: true,
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied "${text}" to clipboard!`)
  }

  const filteredCoupons = (coupons || []).filter((c) => {
    const q = search.toLowerCase()
    return (
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    )
  })

  const totalCoupons = coupons?.length || 0
  const activeCoupons = coupons?.filter((c) => c.is_active && c.used_count < c.max_uses).length || 0
  const exhaustedCoupons = coupons?.filter((c) => c.used_count >= c.max_uses).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            Coupon Codes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create one-time or multi-use coupon codes to let participants bypass payment and register for free.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2"
          variant="primary"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCoupons}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Tag className="h-6 w-6" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available / Active</p>
              <p className="text-2xl font-bold text-accent mt-1">{activeCoupons}</p>
            </div>
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fully Redeemed</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{exhaustedCoupons}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl text-gray-500">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search coupon codes or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={[
            {
              header: 'Coupon Code',
              accessor: (c) => (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md text-sm tracking-wider">
                    {c.code}
                  </span>
                  <button
                    onClick={() => copyToClipboard(c.code)}
                    className="text-gray-400 hover:text-primary transition-colors cursor-pointer"
                    title="Copy code"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ),
            },
            {
              header: 'Description / Note',
              accessor: (c) => (
                <span className="text-sm text-gray-600">
                  {c.description || <span className="text-gray-400 italic">No description</span>}
                </span>
              ),
            },
            {
              header: 'Usage Limit',
              accessor: (c) => {
                const isExhausted = c.used_count >= c.max_uses
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {c.used_count} / {c.max_uses} used
                    </span>
                    {c.max_uses === 1 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                        One-Time
                      </span>
                    )}
                    {isExhausted && (
                      <Badge variant="warning">Exhausted</Badge>
                    )}
                  </div>
                )
              },
            },
            {
              header: 'Status',
              accessor: (c) => {
                const isAvailable = c.is_active && c.used_count < c.max_uses
                return (
                  <button
                    onClick={() => toggleMutation.mutate(c.id)}
                    disabled={toggleMutation.isPending}
                    className="cursor-pointer group flex items-center gap-1.5"
                    title="Click to toggle status"
                  >
                    {c.is_active ? (
                      <Badge variant={isAvailable ? 'success' : 'default'} className="group-hover:opacity-80">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="group-hover:opacity-80">
                        Inactive
                      </Badge>
                    )}
                  </button>
                )
              },
            },
            {
              header: 'Created At',
              accessor: (c) => (
                <span className="text-xs text-gray-500">
                  {formatDate(c.created_at)}
                </span>
              ),
            },
            {
              header: 'Actions',
              accessor: (c) => (
                <button
                  onClick={() => {
                    setSelectedCoupon(c)
                    setDeleteModalOpen(true)
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Coupon"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          data={filteredCoupons}
          loading={isLoading}
          emptyMessage="No coupons found. Click 'Create Coupon' to add one."
        />
      </Card>

      {/* Create Coupon Modal */}
      <Modal open={modalOpen} onClose={closeModal} title="Create New Coupon Code">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <strong>💡 Bypass Payment:</strong> Entering this coupon code on the registration page allows participants to bypass Cashfree and complete registration completely free.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Coupon Code *
            </label>
            <Input
              icon={Tag}
              placeholder="e.g. VIP2026, SPEAKERFREE"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">Codes are automatically converted to uppercase.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Purpose / Description
            </label>
            <Input
              placeholder="e.g. One-time pass for Keynote Speaker"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Max Usages *
            </label>
            <Input
              type="number"
              min="1"
              max="10000"
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Set to <strong>1</strong> for a one-time coupon code (expires after 1 registration).
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} variant="primary">
              Create Coupon
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedCoupon(null)
        }}
        title="Delete Coupon Code"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to permanently delete coupon code{' '}
            <strong className="text-gray-900 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              {selectedCoupon?.code}
            </strong>
            ? Participants will no longer be able to use it.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedCoupon(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => selectedCoupon && deleteMutation.mutate(selectedCoupon.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
