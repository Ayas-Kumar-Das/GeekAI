import { useState } from 'react'
import client from '../../api/client'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Download, FileSpreadsheet, Users, ClipboardCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Export() {
  const [loading, setLoading] = useState({})

  const downloadFile = async (url, filename, key) => {
    setLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const response = await client.get(url, { responseType: 'blob' })
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success(`${filename} downloaded`)
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card title="Participants" icon={Users}>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            Export all registered participants with their details.
          </p>
          <Button
            variant="accent"
            loading={loading.participants}
            onClick={() => downloadFile('/admin/export/participants', 'participants.csv', 'participants')}
          >
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </Card>

        <Card title="Attendance Records" icon={ClipboardCheck}>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            Export all attendance records (event &amp; session).
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="accent"
              loading={loading.attendanceCsv}
              onClick={() => downloadFile('/admin/export/attendance?format=csv', 'attendance.csv', 'attendanceCsv')}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button
              variant="primary"
              loading={loading.attendanceExcel}
              onClick={() => downloadFile('/admin/export/attendance?format=excel', 'attendance.xlsx', 'attendanceExcel')}
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

