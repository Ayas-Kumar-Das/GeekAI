import { PageHero, PlaceholderBadge } from '../components/public/PageHero'
import NativeRegisterForm from '../components/registration/NativeRegisterForm'
import Banner from '../components/ui/Banner'

/**
 * AssistedRegistration — `/register/assisted` (§6.1): the demoted native
 * form for walk-ins, completed by staff. The route sits behind staff auth in
 * App.jsx; this page adds the walk-in framing and the honest pass copy.
 */
export default function AssistedRegistration() {
  return (
    <div className="container-prose py-10 pb-16">
      <PageHero
        eyebrow="Staff · walk-in registration"
        title="Assisted registration"
        lead="Complete this form with a participant who is registering at the desk. Their pass is issued after check-in, not by email."
        crumbs={[
          { to: '/', label: 'Home' },
          { to: '/register', label: 'Register' },
          { label: 'Assisted' },
        ]}
        className="mb-6"
      />

      <Banner tone="info" title="For event staff" className="mb-6">
        Use the participant's own email if they can access it on event day. The photo and
        details you submit here are checked at the arrival desk.
      </Banner>

      <NativeRegisterForm assisted />

      <div className="mt-6">
        <PlaceholderBadge>Walk-in flow — confirm copy with the host office</PlaceholderBadge>
      </div>
    </div>
  )
}
