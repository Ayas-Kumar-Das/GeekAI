import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import {
  Camera,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Upload,
  UserCheck,
  UserX,
  Search,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { getCategoryColor } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function FaceCheckIn() {
  const [activeTab, setActiveTab] = useState('camera') // 'camera' | 'manual'
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [matchResult, setMatchResult] = useState(null)
  const [checkInDone, setCheckInDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Manual fallback state
  const [searchQuery, setSearchQuery] = useState('')
  const [markingManualId, setMarkingManualId] = useState(null)

  // Start webcam
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      setStream(s)
      setCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch (err) {
      setCameraError('Camera access denied or unavailable. Grant camera permissions or upload a photo.')
      setCameraActive(false)
    }
  }, [stream])

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    setCameraActive(false)
  }, [stream])

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [activeTab])

  // Capture current frame and send for face matching
  const handleCaptureAndMatch = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Could not capture frame from camera')
        return
      }
      await processFaceMatch(blob)
    }, 'image/jpeg', 0.92)
  }

  // Handle file upload matching
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFaceMatch(file)
    }
  }

  // Send image to backend face match API
  const processFaceMatch = async (imageBlob) => {
    setAnalyzing(true)
    setMatchResult(null)
    setCheckInDone(false)

    try {
      const formData = new FormData()
      formData.append('photo', imageBlob, 'capture.jpg')

      const res = await client.post('/attendance/face-match', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setMatchResult(res.data)
      if (res.data.matched) {
        if (res.data.already_checked_in) {
          toast('Participant already checked in for the event', { icon: '⚠️' })
        } else {
          toast.success(`Matched: ${res.data.participant.name}`)
        }
      } else {
        toast.error(res.data.message || 'No registered participant matched')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Face recognition service error'
      toast.error(typeof msg === 'string' ? msg : 'Face recognition failed')
    } finally {
      setAnalyzing(false)
    }
  }

  // Mark Present (Confirm Check-In)
  const handleMarkPresent = async () => {
    if (!matchResult?.participant) return
    setSubmitting(true)
    try {
      await client.post('/attendance/', {
        participant_id: matchResult.participant.id,
        session_id: null, // Event-level check-in
        method: 'FACE',
      })
      setCheckInDone(true)
      setMatchResult((prev) => ({ ...prev, already_checked_in: true }))
      toast.success(`✅ Check-In Confirmed! ${matchResult.participant.name} marked Present.`)
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Attendance already recorded for this participant at event level')
        setMatchResult((prev) => ({ ...prev, already_checked_in: true }))
      } else {
        toast.error('Failed to record check-in')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Mark Absent / Reject Match
  const handleMarkAbsent = () => {
    if (matchResult?.participant) {
      toast(`Marked Absent: Check-in skipped for ${matchResult.participant.name}`, { icon: 'ℹ️' })
    }
    resetScan()
  }

  const resetScan = () => {
    setMatchResult(null)
    setCheckInDone(false)
    if (activeTab === 'camera' && !cameraActive) {
      startCamera()
    }
  }

  // Manual fallback query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['manual-face-search', searchQuery],
    queryFn: () => client.get('/participants/', { params: { search: searchQuery, limit: 10 } }).then((r) => r.data),
    enabled: searchQuery.trim().length >= 2,
  })

  // Manual fallback event check-in
  const handleManualMarkPresent = async (participant) => {
    setMarkingManualId(participant.id)
    try {
      await client.post('/attendance/', {
        participant_id: participant.id,
        session_id: null,
        method: 'MANUAL',
      })
      toast.success(`✅ ${participant.name} marked Present (Event Check-In)`)
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(`Already marked: ${participant.name} is already checked in`)
      } else {
        toast.error('Failed to record attendance')
      }
    } finally {
      setMarkingManualId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/volunteer">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Event Face Check-In
            </h1>
            <p className="text-xs text-gray-500">One-time symposium event entry verification</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => { setActiveTab('camera'); resetScan() }}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'camera' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Camera Scan
          </button>
          <button
            onClick={() => { setActiveTab('manual'); resetScan() }}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'manual' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Manual Lookup
          </button>
        </div>
      </div>

      {activeTab === 'camera' ? (
        <div className="space-y-6">
          {/* Camera Viewfinder Card */}
          <Card className="overflow-hidden border-2 border-gray-100 p-4">
            {cameraError ? (
              <div className="p-6 text-center space-y-4">
                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
                <p className="text-sm text-gray-600">{cameraError}</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={startCamera}>
                    <RefreshCw className="h-4 w-4 mr-1.5" /> Retry Camera
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1.5" /> Upload Snapshot
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full max-w-md mx-auto aspect-4/3 bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Face Guide Target Frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-72 border-2 border-dashed border-accent/80 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent" />
                    </div>
                  </div>

                  {analyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                      <RefreshCw className="h-8 w-8 animate-spin text-accent" />
                      <p className="text-sm font-medium">Scanning & Matching Face...</p>
                    </div>
                  )}

                  {cameraActive && (
                    <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE WEBCAM
                    </div>
                  )}
                </div>

                {/* Hidden canvas for snapshot */}
                <canvas ref={canvasRef} className="hidden" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Controls */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={handleCaptureAndMatch}
                    disabled={analyzing || !cameraActive}
                    className="px-6"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Capture & Identify Face
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Match Result Display */}
          {matchResult && (
            <Card className="border-2 border-gray-100 p-5 animate-in fade-in duration-200">
              {matchResult.matched && matchResult.participant ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b pb-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Matched Participant
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                        {matchResult.participant.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-800 font-bold">
                        {Math.round((matchResult.similarity || 0) * 100)}% Match
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                    {/* Participant photo */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      <img
                        src={`/api/participants/${matchResult.participant.id}/photo`}
                        alt={matchResult.participant.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="%23cbd5e1" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>'
                        }}
                      />
                    </div>

                    {/* Participant details */}
                    <div className="flex-1 text-sm space-y-1.5 w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-24">ID:</span>
                        <span className="font-mono font-bold text-gray-900">
                          #{matchResult.participant.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-24">Category:</span>
                        <Badge className={getCategoryColor(matchResult.participant.category)}>
                          {matchResult.participant.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-24">Institution:</span>
                        <span className="font-medium text-gray-800">
                          {matchResult.participant.institution || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-24">Email:</span>
                        <span className="text-gray-600 truncate">
                          {matchResult.participant.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {matchResult.already_checked_in ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      <div className="text-sm">
                        <strong className="text-amber-900 block font-semibold">
                          Already Checked In
                        </strong>
                        <span className="text-amber-700">
                          This participant has already checked in for the event. Duplicate check-ins are prevented.
                        </span>
                      </div>
                    </div>
                  ) : checkInDone ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="text-sm">
                        <strong className="text-emerald-900 block font-semibold">
                          Check-In Successful
                        </strong>
                        <span className="text-emerald-700">
                          Participant marked Present in database.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-800">
                      <span className="font-semibold">Ready for Check-In:</span>
                      Confirm identity and mark as Present or Absent.
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-3">
                    {!matchResult.already_checked_in && !checkInDone ? (
                      <>
                        <Button
                          variant="accent"
                          className="flex-1 py-2.5 font-bold"
                          onClick={handleMarkPresent}
                          disabled={submitting}
                        >
                          <UserCheck className="h-4 w-4 mr-1.5" />
                          Mark Present (Confirm Check-In)
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={handleMarkAbsent}
                          disabled={submitting}
                        >
                          <UserX className="h-4 w-4 mr-1.5" />
                          Mark Absent / Reject
                        </Button>
                      </>
                    ) : (
                      <Button variant="secondary" className="w-full" onClick={resetScan}>
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        Scan Next Participant
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                /* No match result */
                <div className="text-center py-4 space-y-3">
                  <XCircle className="h-10 w-10 text-red-500 mx-auto" />
                  <div>
                    <h4 className="font-semibold text-gray-900">No Participant Matched</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {matchResult.message || 'Face does not match any registered participant with high enough confidence.'}
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button variant="secondary" size="sm" onClick={resetScan}>
                      <RotateCcw className="h-4 w-4 mr-1.5" /> Try Again
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('manual')}>
                      <Search className="h-4 w-4 mr-1.5" /> Use Manual Lookup
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      ) : (
        /* Manual Fallback Lookup Tab */
        <div className="space-y-4">
          <Card className="p-4 space-y-4 border-2 border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Participant for Event Check-In
              </label>
              <Input
                placeholder="Search by name, email, or institution..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                autoFocus
              />
            </div>

            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <p className="text-xs text-gray-400">Type at least 2 characters to search...</p>
            )}

            {isSearching && (
              <div className="text-center py-4 text-sm text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                Searching participants...
              </div>
            )}

            {searchResults && searchResults.items?.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-500">
                No registered participants found matching "{searchQuery}"
              </div>
            )}

            {searchResults && searchResults.items?.length > 0 && (
              <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                {searchResults.items.map((p) => (
                  <div key={p.id} className="p-3 hover:bg-gray-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border shrink-0">
                        <img
                          src={`/api/participants/${p.id}/photo`}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%23cbd5e1" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>'
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate">{p.institution || p.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={getCategoryColor(p.category)}>{p.category}</Badge>
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => handleManualMarkPresent(p)}
                        disabled={markingManualId === p.id}
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        Mark Present
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

