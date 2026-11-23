import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Calendar, ChevronDown, LockKeyhole, MapPin, Ticket } from 'lucide-react'
import { eventDate, eventFee } from '../utils/eventDisplay'
import EventPhoto from '../components/public/EventPhoto'
import { oaicOrganizerLogos } from '../content/oaicLogos'
import client from '../api/client'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'RESEARCHER', label: 'Researcher' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'SPEAKER', label: 'Speaker' },
  { value: 'OTHER', label: 'Other' },
]

const OAIC_GUIDELINES = [
  'Registration is open to students, researchers, professionals, and speakers.',
  'Each participant must register with a unique email address.',
  'Upload a clear, front-facing photograph for AI-powered face recognition at check-in.',
  'The registration fee of ₹300 is non-refundable once paid (unless using an authorized waiver coupon).',
  'Your QR code will be emailed after successful registration — keep it handy for session entry.',
  'Sessions may have limited capacity; check-in is first-come, first-served.',
  'For queries, contact info@oaic.in.',
]

export default function EventRegister() {
  const { eventSlug } = useParams()
  return <EventRegistration key={eventSlug} eventSlug={eventSlug} />
}

function EventRegistration({ eventSlug }) {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const recoveryRef = useRef(null)
  const photoSection = useRef(null)

  const [event, setEvent] = useState(null)
  const [sessions, setSessions] = useState([])
  const [eventLoading, setEventLoading] = useState(true)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', institution: '', category: 'STUDENT',
  })
  const [photo, setPhoto] = useState(null)
  const [selectedSessions, setSelectedSessions] = useState([])
  const [photoConsent, setPhotoConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  // Payment recovery state
  const [paidOrderId, setPaidOrderId] = useState(null)
  const [recoverableOrder, setRecoverableOrder] = useState(null)
  const [manualOrderId, setManualOrderId] = useState('')
  const [verifyingManualOrder, setVerifyingManualOrder] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  /* ── Check for uncompleted paid order in localStorage ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`geekai_paid_order_${eventSlug}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Keep recoverable if within 24 hours
        if (parsed.order_id && parsed.timestamp && Date.now() - parsed.timestamp < 24 * 3600 * 1000) {
          setRecoverableOrder(parsed)
        } else {
          localStorage.removeItem(`geekai_paid_order_${eventSlug}`)
        }
      }
    } catch (e) {
      // ignore JSON errors
    }
  }, [eventSlug])

  /* ── Fetch event + sessions ── */
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const [evtRes, sessRes] = await Promise.all([
          client.get(`/events/${eventSlug}`, { signal: controller.signal }),
          client.get(`/events/${eventSlug}/sessions`, { signal: controller.signal }),
        ])
        setEvent(evtRes.data)
        setSessions(sessRes.data)
      } catch (err) {
        if (controller.signal.aborted) return
        if (err.response?.status === 404) {
          navigate('/', { replace: true })
        } else {
          toast.error('Failed to load event details')
        }
      } finally {
        if (!controller.signal.aborted) setEventLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [eventSlug, navigate, loadAttempt])

  useEffect(() => {
    if (eventLoading) return
    if (hash === '#recover-order' && recoveryRef.current) {
      recoveryRef.current.open = true
      recoveryRef.current.scrollIntoView({ block: 'center' })
      recoveryRef.current.querySelector('input')?.focus({ preventScroll: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [hash, eventLoading])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleSession = (id) =>
    setSelectedSessions(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )

  /* ── Apply Coupon Code ── */
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    setValidatingCoupon(true)
    try {
      const res = await client.post(`/events/${eventSlug}/validate-coupon`, {
        code: couponCode.trim(),
      })
      setAppliedCoupon(res.data)
      toast.success(res.data.message || 'Coupon applied! Registration fee waived.')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid or expired coupon code'
      toast.error(typeof msg === 'string' ? msg : 'Invalid coupon code')
      setAppliedCoupon(null)
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    toast.success('Coupon removed')
  }

  /* ── Submit registration (after payment or coupon bypass) ── */
  const submitRegistration = async (paymentOrderId = null) => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('email', form.email)
    if (form.phone) fd.append('phone', form.phone)
    if (form.institution) fd.append('institution', form.institution)
    fd.append('category', form.category)
    fd.append('photo', photo)
    fd.append('source', 'ONLINE')
    if (event?.id) fd.append('event_id', String(event.id))

    if (appliedCoupon) {
      fd.append('coupon_code', appliedCoupon.code)
      fd.append('payment_status', 'SUCCESS')
    } else if (paymentOrderId) {
      fd.append('payment_order_id', paymentOrderId)
      fd.append('payment_status', 'SUCCESS')
    }

    const { data: attendee } = await client.post('/participants/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    // Registration succeeded: clean up any stored recovery order
    try {
      localStorage.removeItem(`geekai_paid_order_${eventSlug}`)
    } catch (e) {}
    setPaidOrderId(null)
    setRecoverableOrder(null)
    navigate(`/events/${eventSlug}/success`, {
      replace: true,
      state: {
        event: { name: event.name, event_date: event.event_date, venue: event.venue, slug: eventSlug },
        attendee: {
          id: attendee.id, name: attendee.name, email: attendee.email,
          institution: attendee.institution, category: attendee.category,
          qr: attendee.qr_code_url, photo: attendee.photo_url, orderId: paymentOrderId,
        },
      },
    })
  }

  const handleUseRecoverableOrder = (rec) => {
    setAppliedCoupon(null)
    setPaidOrderId(rec.order_id)
    if (rec.email && !form.email) setForm(prev => ({ ...prev, email: rec.email }))
    if (rec.name && !form.name) setForm(prev => ({ ...prev, name: rec.name }))
  }

  const handleDismissRecoverableOrder = () => {
    try {
      localStorage.removeItem(`geekai_paid_order_${eventSlug}`)
    } catch (e) {}
    setRecoverableOrder(null)
  }

  const handleVerifyManualOrder = async () => {
    if (!manualOrderId.trim()) {
      toast.error('Please enter an order ID')
      return
    }
    setVerifyingManualOrder(true)
    try {
      const res = await client.post('/payments/verify', {
        order_id: manualOrderId.trim(),
      })
      if (res.data.paid) {
        setAppliedCoupon(null)
        setPaidOrderId(manualOrderId.trim())
      } else {
        toast.error(`Order ${manualOrderId.trim()} is not marked as paid (${res.data.order_status}).`)
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not verify order'
      toast.error(typeof msg === 'string' ? msg : 'Could not verify order')
    } finally {
      setVerifyingManualOrder(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!photo) {
      photoSection.current?.querySelector('button')?.focus()
      toast.error('Please capture or upload a photo')
      return
    }
    if (!photoConsent) { toast.error('Please consent to photo usage for face recognition'); return }

    setLoading(true)
    try {
      const feeRequired = event?.registration_fee && event.registration_fee > 0

      // Case 1: Coupon applied or event is free -> direct free submission
      if (appliedCoupon || !feeRequired) {
        await submitRegistration()
        return
      }

      // Case 2: Already verified payment order available -> complete registration directly!
      if (paidOrderId) {
        await submitRegistration(paidOrderId)
        return
      }

      // Case 3: Need to create and execute payment on Cashfree
      /* Create Cashfree order */
      const orderRes = await client.post('/payments/create-order', {
        event_slug: eventSlug,
        amount: event.registration_fee,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || '9999999999',
      })
      const { payment_session_id, order_id } = orderRes.data

      /* Load Cashfree SDK and open checkout modal */
      const { load } = await import('@cashfreepayments/cashfree-js')
      const cashfree = await load({ mode: 'sandbox' })

      await cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: '_modal',
      })

      /* Verify payment */
      const verifyRes = await client.post('/payments/verify', { order_id })
      if (verifyRes.data.paid) {
        // Payment is confirmed by Cashfree! Store immediately in state and localStorage so user is never re-charged!
        setPaidOrderId(order_id)
        try {
          localStorage.setItem(`geekai_paid_order_${eventSlug}`, JSON.stringify({
            order_id,
            email: form.email,
            name: form.name,
            timestamp: Date.now(),
          }))
        } catch (e) {}

        await submitRegistration(order_id)
      } else {
        toast.error('Payment was not completed. Please try again.')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      toast.error(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }


  if (eventLoading) return <div className="public-width route-state" role="status">Loading event…</div>
  if (!event) return (
    <div className="public-width route-state">
      <p>Event details couldn’t load.</p>
      <button className="public-button" onClick={() => { setEventLoading(true); setLoadAttempt(loadAttempt + 1) }}>Try again</button>
    </div>
  )

  const amountDue = paidOrderId || appliedCoupon ? 0 : event.registration_fee
  const submitLabel = loading ? 'Processing…' : amountDue > 0 ? 'Pay & Register' : 'Complete Registration'

  return (
    <div className="public-width checkout">
      <Link className="back-link" to="/#active-events"><ArrowLeft size={16} /> Back to Events</Link>
      <div className="checkout-grid">
        <aside className="checkout-aside" aria-label="Event details">
          <section className="event-summary">
            {eventSlug === 'oaic' ? (
              <ul className="summary-organizers" aria-label="OAIC organizers and partners">
                {oaicOrganizerLogos.map(({ src, alt, width, height }) => <li key={src}><img src={src} width={width} height={height} alt={alt} /></li>)}
              </ul>
            ) : (
              <div className="summary-top"><Ticket size={24} strokeWidth={1.5} /><span className="fee mono">{eventFee(event.registration_fee)}</span></div>
            )}
            <h1>{event.name}</h1>
            {event.tagline && <p>{event.tagline}</p>}
            <div className="summary-meta">
              <span><Calendar size={16} /> {eventDate(event.event_date)}</span>
              {event.venue && <span><MapPin size={16} /> {event.venue}</span>}
            </div>
            {eventSlug === 'oaic' && (
              <p className="summary-details-link">
                For full schedule, tracks &amp; event details, visit{' '}
                <a href="https://www.oaic.in/" target="_blank" rel="noopener noreferrer">oaic.in <ArrowUpRight size={14} aria-hidden="true" /></a>
              </p>
            )}
          </section>
          {eventSlug === 'oaic' && (
            <details className="guidelines disclosure">
              <summary>Registration Guidelines &amp; Refund Policy <ChevronDown size={18} /></summary>
              <ol>{OAIC_GUIDELINES.map(item => <li key={item}>{item}</li>)}</ol>
            </details>
          )}
        </aside>

        <form id="event-registration" className="checkout-form" onSubmit={handleSubmit}>
          <section className="form-section" aria-labelledby="attendee-title">
            <h2 id="attendee-title">Attendee details</h2>
            <div className="field-grid">
              <label>Full name <input name="name" autoComplete="name" value={form.name} onChange={handleChange} required /></label>
              <label>Email <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} required /></label>
              <label>Phone number
                <span className="phone-field"><span aria-hidden="true">+91</span><input name="phone" type="tel" autoComplete="tel-national" value={form.phone} onChange={handleChange} required /></span>
              </label>
              <label>Institution <input name="institution" autoComplete="organization" value={form.institution} onChange={handleChange} required /></label>
              <label>Category
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
            </div>
          </section>
          {sessions.length > 0 && (
            <fieldset className="form-section session-section">
              <legend>Sessions <span>(optional)</span></legend>
              {sessions.map(session => (
                <label className="check-row" key={session.id}>
                  <input type="checkbox" checked={selectedSessions.includes(session.id)} onChange={() => toggleSession(session.id)} />
                  <span><strong>{session.name}</strong>{session.location && <small>{session.location}</small>}{session.description && <small>{session.description}</small>}</span>
                </label>
              ))}
            </fieldset>
          )}
          <section className="form-section" aria-labelledby="photo-title" ref={photoSection}>
            <h2 id="photo-title">Check-in photo</h2>
            <EventPhoto photo={photo} onChange={setPhoto} />
            <p className="privacy-note"><LockKeyhole size={15} /> Your photo is used for face recognition at event check-in.</p>
            <label className="check-row">
              <input type="checkbox" checked={photoConsent} onChange={event => setPhotoConsent(event.target.checked)} required />
              <span>I consent to using my photo for face recognition at this event.</span>
            </label>
          </section>
          <section className="form-section" aria-labelledby="checkout-title">
            <h2 id="checkout-title">Checkout</h2>
            {recoverableOrder && !paidOrderId && (
              <div className="checkout-notice">
                <strong>Previous payment found</strong>
                <p className="mono">{recoverableOrder.order_id}</p>
                <div className="action-row">
                  <button type="button" className="public-button" onClick={() => handleUseRecoverableOrder(recoverableOrder)}>Use payment</button>
                  <button type="button" className="public-button ghost" onClick={handleDismissRecoverableOrder}>Dismiss</button>
                </div>
              </div>
            )}
            {paidOrderId && (
              <div className="checkout-notice">
                <strong>Payment confirmed</strong>
                <p className="mono">{paidOrderId}</p>
                <button type="button" className="public-button ghost" onClick={() => setPaidOrderId(null)}>Detach payment</button>
              </div>
            )}
            {event.registration_fee > 0 && !paidOrderId && (
              <>
                <details className="disclosure checkout-option">
                  <summary>{appliedCoupon ? 'Coupon applied' : 'Apply Coupon Code'} <ChevronDown size={18} /></summary>
                  {appliedCoupon ? (
                    <div className="inline-field"><span className="mono">{appliedCoupon.code} · Fee waived</span><button type="button" className="public-button" onClick={handleRemoveCoupon}>Remove</button></div>
                  ) : (
                    <div className="inline-field">
                      <input className="mono" aria-label="Coupon code" placeholder="Coupon code" value={couponCode} onChange={event => setCouponCode(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (!validatingCoupon && !verifyingManualOrder && !loading) handleApplyCoupon() } }} />
                      <button type="button" className="public-button" disabled={validatingCoupon || verifyingManualOrder || loading} onClick={handleApplyCoupon}>{validatingCoupon ? 'Applying…' : 'Apply'}</button>
                    </div>
                  )}
                </details>

                <details className="disclosure checkout-option" id="recover-order" ref={recoveryRef}>
                  <summary>Already paid? Link Cashfree Order ID <ChevronDown size={18} /></summary>
                  <p>Find the order ID in your Cashfree payment receipt.</p>
                  <div className="inline-field">
                    <input className="mono" aria-label="Cashfree order ID" placeholder="Order ID" value={manualOrderId} onChange={event => setManualOrderId(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (!verifyingManualOrder && !validatingCoupon && !loading) handleVerifyManualOrder() } }} />
                    <button type="button" className="public-button" disabled={verifyingManualOrder || validatingCoupon || loading} onClick={handleVerifyManualOrder}>{verifyingManualOrder ? 'Verifying…' : 'Verify'}</button>
                  </div>
                </details>
              </>
            )}
            <div className="checkout-total">
              <div role="status"><span>Total payable</span><strong className="mono">{amountDue > 0 ? eventFee(amountDue) : '₹0'}</strong></div>
              <button type="submit" className="public-button primary" disabled={loading || verifyingManualOrder || validatingCoupon}>{submitLabel} <ArrowRight size={17} /></button>
            </div>
          </section>
        </form>
      </div>
    </div>
  )
}
