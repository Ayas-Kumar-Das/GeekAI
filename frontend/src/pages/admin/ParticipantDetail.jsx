import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { ArrowLeft, Mail, Phone, Building, Tag } from 'lucide-react'
import { getCategoryColor, getMethodBadge, formatDate } from '../../utils/helpers'

export default function ParticipantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: participant, isLoading } = useQuery({
    queryKey: ['participant', id],
    queryFn: () => client.get(`/participants/${id}`).then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  if (!participant) {
    return <p className="text-center text-gray-500 py-20">Participant not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Participant Details</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            {participant.photo_url ? (
              <img
                src={`/${participant.photo_url}`}
                alt={participant.name}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center text-3xl text-gray-400">
                {participant.name?.charAt(0)}
              </div>
            )}
            <h2 className="mt-4 text-xl font-bold text-gray-900">{participant.name}</h2>
            <Badge className={`mt-2 ${getCategoryColor(participant.category)}`}>
              {participant.category}
            </Badge>
          </div>

          <div className="mt-6 space-y-3">
            <InfoRow icon={Mail} label="Email" value={participant.email} />
            <InfoRow icon={Phone} label="Phone" value={participant.phone} />
            <InfoRow icon={Building} label="Institution" value={participant.institution} />
            <InfoRow icon={Tag} label="Registered" value={formatDate(participant.registered_at)} />
          </div>

          {participant.qr_code_url && (
            <div className="mt-6 text-center">
              <img
                src={`/${participant.qr_code_url}`}
                alt="QR Code"
                className="w-40 h-40 mx-auto border rounded-lg"
              />
              <p className="text-xs text-gray-400 mt-1">Participant QR Code</p>
            </div>
          )}
        </Card>

        {/* Attendance History */}
        <Card title="Attendance History" className="lg:col-span-2">
          {participant.attendances?.length > 0 ? (
            <div className="mt-3 divide-y divide-gray-100">
              {participant.attendances.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.session_name || 'Event Check-in'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(a.marked_at)}</p>
                  </div>
                  <Badge className={getMethodBadge(a.method)}>{a.method}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-3">No attendance records yet</p>
          )}
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <span className="text-gray-500 min-w-20">{label}</span>
      <span className="text-gray-900 font-medium">{value || '—'}</span>
    </div>
  )
}

