import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const emptySession = { name: '', description: '', start_time: '', end_time: '', location: '' }

export default function Sessions() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptySession)

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => client.get('/sessions/').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => client.post('/sessions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session created')
      closeModal()
    },
    onError: () => toast.error('Failed to create session'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.put(`/sessions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session updated')
      closeModal()
    },
    onError: () => toast.error('Failed to update session'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted')
    },
    onError: () => toast.error('Failed to delete session'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptySession)
    setModalOpen(true)
  }

  const openEdit = (session) => {
    setEditing(session)
    setForm({
      name: session.name,
      description: session.description || '',
      start_time: session.start_time?.slice(0, 16) || '',
      end_time: session.end_time?.slice(0, 16) || '',
      location: session.location || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptySession)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (session) => {
    if (confirm(`Delete session "${session.name}"?`)) {
      deleteMutation.mutate(session.id)
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Session Name' },
    { key: 'location', label: 'Location', render: (v) => v || '—' },
    { key: 'start_time', label: 'Start', render: (v) => formatDate(v) },
    { key: 'end_time', label: 'End', render: (v) => formatDate(v) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="p-1.5 hover:bg-gray-100 rounded cursor-pointer">
            <Pencil className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row) }} className="p-1.5 hover:bg-red-50 rounded cursor-pointer">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Session</Button>
      </div>

      <Table columns={columns} data={sessions || []} loading={isLoading} emptyMessage="No sessions created yet" />

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Session' : 'New Session'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Session Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time *"
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
            />
            <Input
              label="End Time *"
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              required
            />
          </div>
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

