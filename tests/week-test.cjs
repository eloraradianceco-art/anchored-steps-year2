// Year 2 weeks (2026-11-17): the week you move to stays put, and the app opens on YOUR week (the one you're working
// through on the Steps page), not the last week you browsed.
// Run: npm run build && node tests/week-test.cjs dist   (needs Playwright: npm install --no-save playwright && npx playwright install chromium)
// The database is faked in the browser, so nothing real is touched.
const { chromium, devices } = require('playwright')
const http = require('http'), fs = require('fs'), path = require('path')
const DIST = process.argv[2], PORT = 4871, REF = 'cvtukqamaqrhjtdvmslb'
const UID = '7a1c2e9b-4d3f-4b8a-9c21-5e6f7a8b9c0d'
const user = { id: UID, aud: 'authenticated', role: 'authenticated', email: 'grace@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-04-01T00:00:00Z' }
const token = { access_token: 'x.' + Buffer.from(JSON.stringify({ sub: UID, exp: 4102444800 })).toString('base64') + '.y', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user }
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' }
const server = http.createServer((req, res) => {
  let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]))
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html')
  res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res)
})
const results = []
const check = (k, ok, x) => results.push((ok ? 'PASS ' : 'FAIL ') + k + (x !== undefined ? ' — ' + (typeof x === 'string' ? x : JSON.stringify(x)) : ''))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// One browser + a stand-in profile row. Saves take `saveMs` to land; reads answer after `readMs`.
async function open(browser, { localWeek, serverWeek, saveMs = 500, readMs = 30, dark = true, locked = false, entries = [], homeScreen = false }) {
  const row = { id: 1, user_id: UID, email: user.email, current_week: serverWeek, onboarded: true, dark_mode: dark, bookmarks: [] }
  const db = { profile: locked ? null : row, row, paid: false, reads: 0, saves: [], entryReads: [] }
  const ctx = await browser.newContext({ ...devices['iPhone 14'] })
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ body: '' }))
  await ctx.route(`https://${REF}.supabase.co/**`, async (route) => {
    const req = route.request(), u = new URL(req.url()), m = req.method()
    if (u.pathname.startsWith('/auth/v1/user')) return route.fulfill({ json: user })
    if (u.pathname.startsWith('/auth/v1/token')) return route.fulfill({ json: token })
    if (u.pathname.startsWith('/auth/v1/')) return route.fulfill({ status: 204, body: '' })
    if (u.pathname === '/rest/v1/as2_profiles') {
      if (m === 'GET') { db.reads++; const snap = db.profile ? { ...db.profile } : null; await sleep(db.readMs ?? readMs); return route.fulfill({ json: (req.headers()['accept'] || '').includes('vnd.pgrst.object') ? snap : (snap ? [snap] : []) }) }
      const body = JSON.parse(req.postData() || '{}'); db.saves.push(body)
      await sleep(saveMs); Object.assign(db.profile, body) // the save lands after a moment
      return route.fulfill({ status: 204, body: '' })
    }
    if (u.pathname === '/rest/v1/rpc/claim_purchase') { if (db.paid) db.profile = db.row; return route.fulfill({ json: !!db.paid }) }
    if (u.pathname.startsWith('/rest/v1/rpc/')) return route.fulfill({ json: null })
    if (u.pathname === '/rest/v1/as2_journal_entries' && m === 'GET') {
      const gte = (u.searchParams.getAll('week').find((x) => x.startsWith('gte.')) || '').slice(4), lte = (u.searchParams.getAll('week').find((x) => x.startsWith('lte.')) || '').slice(4)
      const like = (u.searchParams.get('field_key') || '').replace(/^like\./, '').replace('%', '')
      db.entryReads.push(gte ? `${gte}-${lte}` : like)
      return route.fulfill({ json: entries.filter((e) => (gte ? e.week >= +gte && e.week <= +lte : like ? e.field_key.startsWith(like) : true)) })
    }
    if (m !== 'GET' && m !== 'HEAD') return route.fulfill({ status: 201, json: [] })
    return route.fulfill({ json: [] })
  })
  await ctx.addInitScript(([t, wk]) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1')
    localStorage.setItem('sb-cvtukqamaqrhjtdvmslb-auth-token', t); localStorage.setItem('y2_onboarding_complete', '1'); localStorage.setItem('onboarding_complete', 'true')
    if (wk) localStorage.setItem('y2_last_week', String(wk))
  }, [JSON.stringify(token), localWeek])
  if (homeScreen) await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }) }) // opened from the Home Screen icon
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  const week = async () => Number(((await p.locator('.ds-wk').innerText().catch(() => '')).match(/Week (\d+)/) || [])[1] || 0)
  const next = () => p.getByRole('button', { name: 'Next week' }).click()
  const prev = () => p.getByRole('button', { name: 'Previous week' }).click()
  // Leave the app for `ms`, then come back (what pressing Home and tapping the icon does when iOS keeps the app alive)
  const away = async (ms) => {
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
    await p.waitForTimeout(ms)
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')) })
    await p.waitForTimeout(500)
  }
  const pill = p.locator('.ds-yourweek')
  return { ctx, p, db, errs, week, next, prev, away, pill }
}

server.listen(PORT, async () => {
  const browser = await chromium.launch()
  const URL_ = `http://localhost:${PORT}/`

  // 1. The reported bug: Next, then it must stay
  let t = await open(browser, { localWeek: 3, serverWeek: 3 })
  await t.p.goto(URL_); await t.p.waitForTimeout(2500)
  check('opens on the saved week (3)', (await t.week()) === 3, await t.week())
  await t.next(); await t.p.waitForTimeout(150)
  check('Next → week 4 right away', (await t.week()) === 4, await t.week())
  await t.p.waitForTimeout(1800)
  check('…and it stays on week 4', (await t.week()) === 4, await t.week())
  await t.next(); await t.next(); await t.next(); await t.p.waitForTimeout(2200)
  check('three quick Next taps → week 7, and stays', (await t.week()) === 7, await t.week())
  await t.prev(); await t.p.waitForTimeout(1800)
  check('Previous → week 6, and stays', (await t.week()) === 6, await t.week())
  check('the account ends up on week 6', t.db.profile.current_week === 6, t.db.profile.current_week)
  const readsBefore = t.db.reads
  await t.next(); await t.p.waitForTimeout(1500); await t.prev(); await t.p.waitForTimeout(1500)
  check('changing weeks no longer re-reads the profile', t.db.reads === readsBefore, { before: readsBefore, after: t.db.reads })
  // Coming back to the tab doesn't move the week either
  await t.p.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')) }); await t.p.waitForTimeout(1500)
  check('returning to the app keeps the week', (await t.week()) === 6, await t.week())
  // Jump from Contents
  await t.p.reload(); await t.p.waitForTimeout(2500)
  check('reopening the app: still week 6', (await t.week()) === 6, await t.week())
  check('no page errors', t.errs.length === 0, t.errs.slice(0, 2))
  await t.ctx.close()

  // 2. Tapping Next while the app is still loading the account (slow connection)
  t = await open(browser, { localWeek: 3, serverWeek: 3, readMs: 1800 })
  await t.p.goto(URL_); await t.p.locator('.ds-wk').waitFor({ timeout: 15000 })
  await t.next(); await t.p.waitForTimeout(3200)
  check('slow load + Next: stays on week 4', (await t.week()) === 4, await t.week())
  check('slow load + Next: account saved as week 4', t.db.profile.current_week === 4, t.db.profile.current_week)
  await t.ctx.close()

  // 3. Another device is further along: this one catches up, and never overwrites the account with its old week
  t = await open(browser, { localWeek: 2, serverWeek: 9 })
  await t.p.goto(URL_); await t.p.waitForTimeout(2800)
  check('other device was on week 9: opens on 9', (await t.week()) === 9, await t.week())
  check("this device's old week (2) is never saved over it", !t.db.saves.some((s) => s.current_week === 2) && t.db.profile.current_week === 9, t.db.saves)
  await t.ctx.close()

  // 4. First time on this device (nothing saved locally) and no week on the account yet
  t = await open(browser, { localWeek: 0, serverWeek: null })
  await t.p.goto(URL_); await t.p.waitForTimeout(2500)
  check('brand-new reader opens on week 1', (await t.week()) === 1, await t.week())
  await t.next(); await t.p.waitForTimeout(1500)
  check('brand-new reader: Next → 2, saved', (await t.week()) === 2 && t.db.profile.current_week === 2, [await t.week(), t.db.profile.current_week])
  await t.ctx.close()

  // 5. Dark mode set on another device isn't overwritten at start-up, and a toggle sticks
  t = await open(browser, { localWeek: 3, serverWeek: 3, dark: false })
  await t.ctx.addInitScript(() => { if (!sessionStorage.getItem('d')) { sessionStorage.setItem('d', '1'); localStorage.setItem('y2_dark_mode', '1') } })
  await t.p.goto(URL_); await t.p.waitForTimeout(2800)
  check("account's light mode isn't overwritten by this device's old setting", t.db.profile.dark_mode === false && !t.db.saves.some((s) => s.dark_mode === true), t.db.saves)
  await t.ctx.close()

  // 6. Signed in without a purchase → locked screen → "I've Paid · Check Again" once the purchase exists → opens
  t = await open(browser, { localWeek: 0, serverWeek: 1, locked: true })
  await t.p.goto(URL_); await t.p.waitForTimeout(2800)
  check('no purchase: locked screen', (await t.p.getByRole('button', { name: /Check Again/ }).count()) === 1 && (await t.p.locator('.ds-wk').count()) === 0)
  await t.p.getByRole('button', { name: /Check Again/ }).click(); await t.p.waitForTimeout(1200)
  check('Check Again with no purchase: still locked, says so', /don't see a Year 2/.test(await t.p.locator('body').innerText()))
  t.db.paid = true
  await t.p.getByRole('button', { name: /Check Again/ }).click(); await t.p.waitForTimeout(2500)
  check('Check Again after paying: the app opens (not stuck on checking)', (await t.week()) === 1, await t.p.locator('body').innerText().then((x) => x.slice(0, 80)))
  await t.next(); await t.p.waitForTimeout(1500)
  check('…and Next works there too', (await t.week()) === 2, await t.week())
  await t.ctx.close()

  // 7. Entries still load as the reader moves through weeks, and whole-year progress loads once
  const E = [{ id: 1, user_id: UID, week: 9, field_key: 'reflection', field_value: 'Week nine reflection.' }]
  t = await open(browser, { localWeek: 3, serverWeek: 3, entries: E })
  await t.p.goto(URL_); await t.p.waitForTimeout(2500)
  const first = [...t.db.entryReads]
  await t.next(); await t.p.waitForTimeout(900)
  check('first load reads weeks 1-8, progress (ds_) and trackers (tr_) once', first.filter((x) => x === '1-8').length === 1 && first.filter((x) => x === 'ds_').length === 1 && first.filter((x) => x === 'tr_').length === 1, first)
  check('moving a week reads the new range only (no repeat of the year-wide reads)', JSON.stringify(t.db.entryReads.slice(first.length)) === JSON.stringify(['1-9']), t.db.entryReads.slice(first.length))
  check('no page errors (entries)', t.errs.length === 0, t.errs.slice(0, 2))
  await t.ctx.close()

  // ── Your week (2026-11-17): the app opens on the week you're working through, not the last one you browsed ──
  const dayAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  const ds = (week, key, n, id) => ({ id, user_id: UID, week, field_key: 'ds_' + key, field_value: dayAgo(n) })
  const W1D2 = [ds(1, 'start', 1, 11), ds(1, '1', 1, 12)] // week 1: step 1 done yesterday, step 2 open today

  // 8. Week 1, day two. Browse ahead, close, open → back on week 1
  t = await open(browser, { localWeek: 1, serverWeek: 1, entries: W1D2 })
  await t.p.goto(URL_); await t.p.waitForTimeout(2500)
  check('your week: opens on week 1', (await t.week()) === 1 && (await t.pill.count()) === 0, await t.week())
  await t.next(); await t.p.waitForTimeout(1200)
  check('browsing week 2 shows "Back to your week (Week 1)"', (await t.week()) === 2 && /Back to your week \(Week 1\)/.test(await t.pill.innerText().catch(() => '')), await t.pill.innerText().catch(() => 'none'))
  if (process.env.SHOT) await t.p.screenshot({ path: process.env.SHOT })
  await t.p.reload(); await t.p.waitForTimeout(2500)
  check('close and open after browsing week 2 → week 1', (await t.week()) === 1, await t.week())
  await t.next(); await t.next(); await t.p.waitForTimeout(600)
  await t.pill.click(); await t.p.waitForTimeout(600)
  check('"Back to your week" from week 3 → week 1', (await t.week()) === 1 && (await t.pill.count()) === 0, await t.week())
  // In a browser tab, flipping away for a moment doesn't move you
  await t.next(); await t.p.waitForTimeout(400); await t.away(2500)
  check('browser tab: a short trip away keeps the week you were browsing', (await t.week()) === 2, await t.week())
  check('your week: no page errors', t.errs.length === 0, t.errs.slice(0, 2))
  await t.ctx.close()

  // 9. Home Screen app: iOS keeps the app alive, so "open" is a return from the background
  t = await open(browser, { localWeek: 1, serverWeek: 1, entries: W1D2, homeScreen: true })
  await t.p.goto(URL_); await t.p.waitForTimeout(2500)
  await t.next(); await t.p.waitForTimeout(500); await t.away(2500)
  check('Home Screen app: browse week 2, leave, come back → week 1', (await t.week()) === 1, await t.week())
  // …but never while a step is open
  await t.next(); await t.p.waitForTimeout(500)
  await t.p.locator('.ds-stone').first().click(); await t.p.waitForTimeout(700)
  const stepOpen = (await t.p.locator('.ds-overlay').count()) > 0
  await t.away(2500)
  const stillOpen = (await t.p.locator('.ds-overlay').count()) > 0
  await t.p.keyboard.press('Escape'); await t.p.waitForTimeout(500)
  check('Home Screen app: a step open on week 2 is left alone', stepOpen && stillOpen && (await t.week()) === 2, { stepOpen, stillOpen, week: await t.week() })
  await t.ctx.close()

  // 10. Another device that last browsed week 5 (and the account says 5): steps progress still wins
  t = await open(browser, { localWeek: 5, serverWeek: 5, entries: W1D2 })
  await t.p.goto(URL_); await t.p.waitForTimeout(2800)
  check('second device (last browsed week 5): opens on week 1', (await t.week()) === 1, await t.week())
  await t.ctx.close()

  // 11. Week 1 finished → opens on week 2, ready to start
  t = await open(browser, { localWeek: 1, serverWeek: 1, entries: [ds(1, 'start', 8, 20), ...[1, 2, 3, 4, 5, 6, 7].map((n) => ds(1, String(n), 8 - n, 20 + n))] })
  await t.p.goto(URL_); await t.p.waitForTimeout(2800)
  check('week 1 finished: opens on week 2', (await t.week()) === 2, await t.week())
  await t.prev(); await t.p.waitForTimeout(600)
  check('looking back at finished week 1: no duplicate button (it already says Start week 2)', (await t.pill.count()) === 0 && /Start week 2/.test(await t.p.locator('body').innerText()))
  await t.ctx.close()

  await browser.close(); server.close()
  console.log(results.join('\n')); console.log(results.filter((r) => r.startsWith('FAIL')).length + ' failed of ' + results.length)
})
