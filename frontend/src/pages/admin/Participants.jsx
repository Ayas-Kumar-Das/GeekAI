import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'
import Table from '../../components/ui/Table'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCategoryColor, formatShortDate } from '../../utils/helpers'

const categories = ['', 'STUDENT', 'RESEARCHER', 'PROFESSIONAL', 'SPEAKER', 'OTHER']

export default function Participants() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['participants', search, category, page],
    queryFn: () =>
      client
        .get('/participants/', {
          params: {
            search: search || undefined,
            category: category || undefined,
            skip: page * limit,
            limit,
          },
        })
        .then((r) => r.data),
  })

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'institution', label: 'Institution', render: (v) => v || '—' },
    {
      key: 'category',
      label: 'Category',
      render: (v) => <Badge className={getCategoryColor(v)}>{v}</Badge>,
    },
    {
      key: 'registered_at',
      label: 'Registered',
      render: (v) => formatShortDate(v),
    },
  ]

  const totalPages = Math.ceil((data?.total || 0) / limit)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Participants</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(0) }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Categories</option>
          {categories.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        onRowClick={(row) => navigate(`/admin/participants/${row.id}`)}
        emptyMessage="No participants found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, data?.total)} of {data?.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

