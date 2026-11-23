import { useEffect, useRef, useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'

export default function EventPhoto({ photo, onChange }) {
  const upload = useRef(null)
  const camera = useRef(null)
  const video = useRef(null)
  const streamRef = useRef(null)
  const cameraRequest = useRef(0)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!photo) return
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  useEffect(() => () => {
    cameraRequest.current += 1
    streamRef.current?.getTracks().forEach(track => track.stop())
  }, [])

  useEffect(() => {
    if (cameraOpen && video.current) video.current.srcObject = streamRef.current
  }, [cameraOpen])

  const closeCamera = () => {
    cameraRequest.current += 1
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setCameraOpen(false)
    setCameraReady(false)
  }

  const startCamera = async () => {
    if (matchMedia('(pointer: coarse)').matches || !navigator.mediaDevices?.getUserMedia) {
      camera.current.click()
      return
    }

    setError('')
    const request = ++cameraRequest.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (request !== cameraRequest.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = stream
      setCameraOpen(true)
    } catch {
      if (request === cameraRequest.current) setError('Camera access is unavailable. You can upload a photo instead.')
    }
  }

  const capturePhoto = () => {
    const source = video.current
    if (!source?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(source.videoWidth, 960)
    canvas.height = Math.round(source.videoHeight * canvas.width / source.videoWidth)
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
    const request = cameraRequest.current
    canvas.toBlob(blob => {
      if (blob && request === cameraRequest.current) select(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
  }

  const select = file => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    setError('')
    closeCamera()
    onChange(file)
  }

  const handleInput = event => {
    select(event.target.files[0])
    event.target.value = ''
  }

  return (
    <>
      <div className="photo-zone" onDragOver={event => event.preventDefault()} onDrop={event => {
        event.preventDefault()
        select(event.dataTransfer.files[0])
      }}>
        {cameraOpen ? (
          <video className="photo-video" ref={video} autoPlay playsInline muted onLoadedData={() => setCameraReady(true)} />
        ) : photo && preview ? (
          <div className="photo-selected">
            <div className="photo-preview"><img src={preview} alt="Your selected check-in photo" onError={() => setError('This image could not be previewed. Try a JPEG or PNG.')} /></div>
            <div><strong>Photo selected</strong><p>{photo.name}</p></div>
            <button className="icon-action" type="button" aria-label="Remove photo" onClick={() => { onChange(null); setError('') }}><X size={18} /></button>
          </div>
        ) : <p>Choose a clear, front-facing photo.</p>}
        <div className="action-row">
          {cameraOpen ? <>
            <button type="button" className="public-button primary" onClick={capturePhoto} disabled={!cameraReady}><Camera size={16} /> Capture</button>
            <button type="button" className="public-button ghost" onClick={closeCamera}>Cancel</button>
          </> : <button type="button" className="public-button" onClick={startCamera}><Camera size={16} /> Take Photo</button>}
          <button type="button" className="public-button" onClick={() => upload.current.click()}><Upload size={16} /> Upload Photo</button>
        </div>
        <input hidden ref={camera} type="file" accept="image/*" capture="user" onChange={handleInput} />
        <input hidden ref={upload} type="file" accept="image/*" onChange={handleInput} />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  )
}
