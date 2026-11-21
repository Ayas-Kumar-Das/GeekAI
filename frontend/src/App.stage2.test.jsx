import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './context/AuthContext'

function renderAt(path) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

/** Every page must avoid the forbidden "QR emailed" claim (§7.1 content rules). */
function expectNoQrEmailedClaim() {
  const text = document.body.textContent ?? ''
  const forbidden = [
    /your (qr )?code has been sent/i,
    /qr (code )?(was|has been) (emailed|sent)/i,
    /sent to your (email|inbox)/i,
    /check your inbox/i,
    /qr[^.]{0,40}emailed/i,
  ]
  for (const pattern of forbidden) {
    expect(text).not.toMatch(pattern)
  }
}

const publicRoutes = [
  ['/', /Intelligence,/i],
  ['/programme', /A programme in progress/i],
  ['/speakers', /Voices to be announced/i],
  ['/venue', /Find your way in/i],
  ['/faq', /Good to know/i],
  ['/privacy', /Privacy notice/i],
  ['/accessibility', /Accessibility at the symposium/i],
  ['/code-of-conduct', /Code of conduct/i],
  ['/registration/status', /Check your registration status/i],
  ['/register', /Register for the symposium/i],
]

describe('Stage 2 public routes', () => {
  it.each(publicRoutes)('renders %s with its heading', async (path, heading) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy()
    expectNoQrEmailedClaim()
  })

  it('renders every public route inside the public shell (header + footer)', async () => {
    renderAt('/faq')
    await screen.findByRole('heading', { level: 1, name: /Good to know/i })
    // PublicLayout masthead + PageHero both use <header>; the shell one is first.
    const banners = screen.getAllByRole('banner')
    expect(banners.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('contentinfo')).toBeTruthy() // <footer>
    // Footer "Registration status" is guarded by the ticketPage flag (ON in dev)
    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByRole('link', { name: 'Registration status' })).toBeTruthy()
  })

  it('offers a one-click path from the landing hero to registration', async () => {
    renderAt('/')
    await screen.findByRole('heading', { level: 1, name: /Intelligence,/i })
    const links = screen.getAllByRole('link', { name: /Register interest/i })
    expect(links.length).toBeGreaterThan(0)
    expect(links.some((a) => a.getAttribute('href') === '/register')).toBe(true)
  })

  it('shows honest placeholders on the landing page', async () => {
    renderAt('/')
    await screen.findByRole('heading', { level: 1, name: /Intelligence,/i })
    expect(screen.getAllByText('Date to be announced').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Speaker to be announced').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/registration required/i).length).toBeGreaterThan(0)
    // working copy label for the hero line
    expect(screen.getByText(/pending host approval/i)).toBeTruthy()
  })
})

describe('Stage 2 in-site registration form', () => {
  it('renders the real form with all required fields and no external handoff', async () => {
    renderAt('/register')
    await screen.findByRole('heading', { level: 1, name: /Register for the symposium/i })
    expect(screen.getByRole('textbox', { name: /Full name/i })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /Email/i })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /Category/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /consent to the collection/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Submit registration/i })).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/google forms?/i)
    expectNoQrEmailedClaim()
    expect(screen.getAllByText(/pass is issued at the arrival desk/i).length).toBeGreaterThan(0)
  })

  it('validates required fields and shows a summary on submit', async () => {
    const user = userEvent.setup()
    renderAt('/register')
    await screen.findByRole('heading', { level: 2, name: /Your details/i })
    await user.click(screen.getByRole('button', { name: /Submit registration/i }))
    expect(await screen.findByText(/Please check 7 fields before submitting/i)).toBeTruthy()
    expect(screen.getAllByText(/Full name is required/i).length).toBeGreaterThan(0)
    expectNoQrEmailedClaim()
  })

  it('links already-registered participants to status in one click', async () => {
    renderAt('/register')
    await screen.findByRole('heading', { level: 1, name: /Register for the symposium/i })
    const statusLink = screen.getByRole('link', { name: /Already registered\? Check status/i })
    expect(statusLink.getAttribute('href')).toBe('/registration/status')
  })

  it('sends unauthenticated visitors to sign in for assisted registration', async () => {
    renderAt('/register/assisted')
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeTruthy()
  })
})

describe('Stage 2 programme tabs', () => {
  it('filters sessions by track', async () => {
    const user = userEvent.setup()
    renderAt('/programme')
    await screen.findByRole('heading', { level: 1, name: /A programme in progress/i })

    const tabs = screen.getByRole('tablist', { name: /Filter sessions by track/i })
    expect(within(tabs).getAllByRole('tab')).toHaveLength(4)

    await user.click(within(tabs).getByRole('tab', { name: 'Workshops' }))
    expect(screen.getByText('Applied AI workshop')).toBeTruthy()
    expect(screen.queryByText('Research and applications track')).toBeNull()
    expectNoQrEmailedClaim()
  })
})
