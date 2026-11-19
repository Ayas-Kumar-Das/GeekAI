/**
 * Visual QA — Stage 2 exit criteria: "360px and 1440px pass".
 *
 *   node scripts/visual-qa.mjs [baseUrl]        (default http://localhost:4173)
 *
 * For every public route at 360px and 1440px it checks:
 *   - no horizontal page scroll (scrollWidth <= viewport width)
 *   - no elements overflowing the viewport to the right
 *   - no console errors / uncaught exceptions
 * Screenshots of the landing page at both widths go to ../.qa/ (git-ignored).
 * Exits non-zero if any check fails.
 */
import { launch } from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const base = process.argv[2] || 'http://localhost:4173'

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const executablePath = chromeCandidates.find((p) => fs.existsSync(p))
if (!executablePath) {
  console.error('No Chrome/Chromium found. Set CHROME_PATH and re-run.')
  process.exit(1)
}

const routes = [
  '/',
  '/programme',
  '/speakers',
  '/venue',
  '/faq',
  '/register',
  '/registration/status',
  // Phase 2 participant screens — demo tokens render without the API (§7.3/§7.4)
  '/registration/status?token=demo',
  '/registration/status?token=demo-pass',
  '/ticket/demo',
  '/ticket/demo-pass',
  '/privacy',
  '/accessibility',
  '/code-of-conduct',
]
const widths = [360, 1440]

/** Routes that also get a full-page screenshot for the review record. */
const shotRoutes = new Set([
  '/',
  '/registration/status?token=demo',
  '/registration/status?token=demo-pass',
  '/ticket/demo-pass',
])

const shotDir = path.join(root, '..', '.qa')
fs.mkdirSync(shotDir, { recursive: true })

const browser = await launch({ executablePath, headless: 'new' })
let failures = 0

for (const width of widths) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: width === 360 ? 800 : 900, deviceScaleFactor: 1 })

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))

  for (const route of routes) {
    consoleErrors.length = 0
    await page.goto(base + route, { waitUntil: 'networkidle0', timeout: 30000 })
    // let lazy routes + fonts settle
    await page.evaluate(() => document.fonts?.ready)

    const result = await page.evaluate(() => {
      const doc = document.scrollingElement
      const vw = window.innerWidth
      const isClipped = (el) => {
        // Skip elements visually clipped by an overflow-hidden ancestor —
        // their layout rect extends past the viewport but is never painted.
        let node = el.parentElement
        while (node && node !== document.body) {
          const style = getComputedStyle(node)
          if (
            ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) ||
            ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY)
          ) {
            return true
          }
          node = node.parentElement
        }
        return false
      }
      const offenders = []
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        // right-edge overflow (allow 1px rounding)
        if (rect.right > vw + 1) {
          const style = getComputedStyle(el)
          if (style.position === 'fixed') continue
          if (isClipped(el)) continue
          offenders.push(
            `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : ''} right=${Math.round(rect.right)}`
          )
        }
        if (offenders.length >= 6) break
      }
      return { scrollWidth: doc.scrollWidth, vw, offenders }
    })

    const overflow = result.scrollWidth > result.vw + 1
    const errs = consoleErrors.filter((e) => !e.includes('favicon'))
    const ok = !overflow && result.offenders.length === 0 && errs.length === 0

    if (!ok) {
      failures++
      console.log(`FAIL ${width}px ${route}`)
      if (overflow) console.log(`  page scrollWidth=${result.scrollWidth} > viewport ${result.vw}`)
      for (const o of result.offenders) console.log(`  overflow: ${o}`)
      for (const e of errs) console.log(`  console: ${e}`)
    } else {
      console.log(`ok   ${width}px ${route}`)
    }

    if (shotRoutes.has(route)) {
      const name =
        route === '/'
          ? 'home'
          : route.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
      await page.screenshot({
        path: path.join(shotDir, `${name}-${width}.png`),
        fullPage: true,
      })
    }
  }

  await page.close()
}

await browser.close()

if (failures > 0) {
  console.log(`\n${failures} failing check(s).`)
  process.exit(1)
}
console.log('\nAll responsive checks passed.')
