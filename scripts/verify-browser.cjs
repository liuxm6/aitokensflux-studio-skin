const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const languages = Object.fromEntries(['zh', 'zh-TW', 'en', 'ru'].map((name) => [name, require(`../src/i18n/locales/${name}.json`)]))
const base = process.env.BASE_URL || 'http://host.docker.internal:4174'
const output = path.resolve(__dirname, '../artifacts')

const routes = [
  ['home', 'The right intelligence. For every idea.'], ['models', 'Explore the model library'],
  ['models/openai/gpt-4.1', 'GPT-4.1'], ['discover', 'Find your next favorite model'],
  ['providers', 'Great minds. One connection.'], ['pricing', 'Clear pricing. In one place.'],
  ['status', 'A calm view of your services.'], ['docs', 'From idea to first request.'],
  ['rankings', 'See what is finding its rhythm.'], ['console', 'A good day to build, Alex.'],
  ['console/keys', 'API keys'], ['console/activity', 'Your activity, at a glance'],
  ['console/logs', 'Every request has a story'], ['console/credits', 'A little fuel for your ideas.'],
  ['console/settings', 'A workspace that feels like yours.'], ['console/profile', 'A little about you.'],
  ['console/notifications', 'Only the updates you need.'], ['console/privacy', 'Your data. Your choices.'],
  ['console/preferences', 'Make yourself comfortable.'], ['o', 'Better together.'],
  ['o/studio/console', 'Your team, in sync.'], ['o/studio/members', 'Good work starts with good people.'],
  ['o/studio/billing', 'A little fuel for your ideas.'], ['o/studio/invoices', 'Your records, neatly in order.'],
  ['o/studio/activity', 'Your activity, at a glance'], ['o/studio/audit', 'A clear trail of changes'],
  ['o/studio/settings', 'A workspace that feels like yours.'],
  ['o/studio/w/default/console', 'A little clarity for your workspace.'],
  ['o/studio/w/default/keys', 'API keys'], ['o/studio/w/default/members', 'Good work starts with good people.'],
  ['o/studio/w/default/usage', 'Every request has a story'], ['o/studio/w/default/guardrails', 'Freedom, with a few good boundaries.'],
  ['o/studio/w/default/settings', 'A workspace that feels like yours.'], ['invite/demo', 'There is a place for you here.'],
]

let runningBrowser
async function main() {
  fs.mkdirSync(output, { recursive: true })
  const browser = runningBrowser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true, chromiumSandbox: true, args: ['--disable-dev-shm-usage'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' })
  const page = await context.newPage()
  const errors = []
  const businessRequests = []
  const checks = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', (request) => { if (/^\/(api|v1)(\/|$)/.test(new URL(request.url()).pathname)) businessRequests.push(request.url()) })
  let language = 'zh'
  const t = (key) => languages[language][key] ?? key
  const heading = (key) => page.getByRole('heading', { name: t(key).replace(/<\/?accent>/g, '').replace(/\s+/g, ' '), level: 1, exact: true })
  async function visit(route, key) {
    await page.goto(`${base}/#/${route}`, { waitUntil: 'domcontentloaded' })
    await heading(key).waitFor({ timeout: 20000 })
    await page.locator('.skeleton').first().waitFor({ state: 'hidden' })
  }
  async function review() { await page.getByRole('button', { name: t('Preview controls'), exact: true }).click(); await page.getByRole('dialog').waitFor() }
  async function closeReview() { await page.getByRole('button', { name: t('Back to preview'), exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }) }
  async function chooseOption(label, value) {
    const languageNames = { zh: '简体中文', 'zh-TW': '繁體中文', en: 'English', ru: 'Русский' }
    await page.getByRole('combobox', { name: t(label), exact: true }).first().click()
    await page.getByRole('option', { name: languageNames[value] || t(value), exact: true }).click()
    await page.getByRole('listbox').waitFor({ state: 'hidden' })
  }

  await visit('home', 'The right intelligence. For every idea.')
  const introBox = await page.locator('.hero-copy').boundingBox()
  const previewBox = await page.locator('.hero-preview').boundingBox()
  assert.ok(previewBox.y >= introBox.y + introBox.height, 'Conversation must sit below the centered intro, not beside it')
  assert.ok(Math.abs(previewBox.x + previewBox.width / 2 - (introBox.x + introBox.width / 2)) < 2, 'Conversation must share the intro center line')
  checks.push('reference layout: centered intro, CTA row, then wide conversation')
  await page.getByRole('button', { name: t('Code'), exact: true }).click()
  await page.locator('.preview-code pre').waitFor()
  const codeBox = await page.locator('.hero-preview').boundingBox()
  assert.ok(Math.abs(codeBox.height - previewBox.height) < 1, 'Switching to code must not move the composer or resize the card')
  await page.getByRole('button', { name: t('Chat'), exact: true }).click()
  await page.locator('.preview-code').waitFor({ state: 'hidden' })
  checks.push('chat/code switch keeps the card and composer stable')
  await page.getByRole('textbox', { name: t('Your message') }).fill('A thoughtful interface')
  await page.getByRole('button', { name: t('Send demo message') }).click()
  await page.getByText(t('This is a simulated reply. Your message stays in this browser, and no AI model was called.')).waitFor()
  checks.push('home message simulates a reply without a model request')
  for (const [route, key] of routes) { await visit(route, key); checks.push(`route: ${route}`) }

  await visit('models', 'Explore the model library')
  await page.getByRole('textbox', { name: t('Search models') }).fill('no-such-model')
  await page.getByRole('heading', { name: t('Nothing here yet') }).waitFor()
  await page.getByRole('textbox', { name: t('Search models') }).fill('Claude')
  await page.getByRole('heading', { name: 'Claude Sonnet' }).waitFor()
  assert.equal(await page.locator('.model-card').count(), 1)
  await page.getByRole('button', { name: t('Favorite {{model}}').replace('{{model}}', 'Claude Sonnet') }).click()
  await page.getByRole('button', { name: t('Show favorites') }).click()
  assert.equal(await page.locator('.model-card').count(), 1)
  checks.push('catalog query deep link, empty state, favorites and filtering')

  await visit('console/keys', 'API keys')
  await page.getByRole('button', { name: t('Create a key'), exact: true }).click()
  await page.getByRole('button', { name: t('Save changes') }).click()
  await page.getByRole('alert').filter({ hasText: t('This field is required.') }).waitFor()
  await page.getByRole('textbox', { name: t('Key name') }).fill('Browser review key')
  await page.getByRole('button', { name: t('Save changes') }).click()
  await page.getByText(/^DEMO_NOT_A_REAL_KEY_/).waitFor()
  await page.getByRole('button', { name: t('I have copied it') }).click()
  await page.getByText(/^DEMO_NOT_A_REAL_KEY_/).waitFor({ state: 'hidden' })
  await page.getByText('Browser review key', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => Object.values(localStorage).some((value) => value.includes('DEMO_NOT_A_REAL_KEY'))), false)
  checks.push('key validation, creation, one-time display and no secret persistence')

  await visit('o/studio/members', 'Good work starts with good people.')
  await page.getByRole('button', { name: t('Invite member'), exact: true }).click()
  await page.getByRole('textbox', { name: t('Name'), exact: true }).fill('Taylor Preview')
  await page.getByRole('textbox', { name: t('Email'), exact: true }).fill('taylor@example.test')
  await page.getByRole('button', { name: t('Create demo invitation') }).click()
  await page.getByText('Taylor Preview', { exact: true }).waitFor()
  await review()
  await chooseOption('Preview role', 'member')
  await closeReview()
  assert.equal(await page.getByRole('button', { name: t('Invite member'), exact: true }).isDisabled(), true)
  await review(); await chooseOption('Preview role', 'owner'); await closeReview()
  checks.push('member invitation and role-dependent actions')

  await visit('o/studio/w/default/settings', 'A workspace that feels like yours.')
  await page.getByRole('tab', { name: t('Danger zone') }).click()
  assert.equal(await page.getByRole('button', { name: t('Review deletion') }).isDisabled(), true)
  checks.push('default workspace cannot be deleted')

  await review()
  await page.getByRole('switch', { name: t('Show optional concepts') }).click()
  await closeReview()
  for (const [route, key] of Object.entries({ files: 'Files', guardrails: 'Guardrails', byok: 'Your provider keys', routing: 'Routing', presets: 'Presets', tools: 'Tools', observability: 'Observability' })) { await visit(`console/${route}`, key); checks.push(`optional concept: ${route}`) }

  for (const next of ['zh-TW', 'en', 'ru', 'zh']) {
    await visit('home', 'The right intelligence. For every idea.')
    await chooseOption('Interface language', next)
    language = next
    await heading('The right intelligence. For every idea.').waitFor()
    assert.equal(await page.locator('html').getAttribute('lang'), next === 'zh' ? 'zh-CN' : next)
    await visit('console/keys', 'API keys')
    await page.getByRole('button', { name: t('Create a key'), exact: true }).click()
    await page.getByRole('button', { name: t('Save changes') }).click()
    await page.getByRole('alert').filter({ hasText: t('This field is required.') }).waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    checks.push(`language and validation: ${next}`)
  }

  await visit('home', 'The right intelligence. For every idea.')
  await page.screenshot({ path: path.join(output, 'home-desktop.png'), fullPage: true })
  await visit('console', 'A good day to build, Alex.')
  await page.locator('.recharts-surface').waitFor()
  await page.screenshot({ path: path.join(output, 'console-desktop.png'), fullPage: true })
  await page.getByRole('button', { name: t('Toggle color theme') }).click()
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
  await page.screenshot({ path: path.join(output, 'console-dark.png'), fullPage: true })
  await page.getByRole('button', { name: t('Toggle color theme') }).click()
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'))

  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [route, key] of [['home', 'The right intelligence. For every idea.'], ['models', 'Explore the model library'], ['console', 'A good day to build, Alex.'], ['console/keys', 'API keys'], ['o/studio/settings', 'A workspace that feels like yours.']]) {
      await visit(route, key)
      const overflow = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }))
      assert.ok(overflow.document <= overflow.viewport, `${route} overflows at ${width}: ${JSON.stringify(overflow)}`)
    }
    checks.push(`responsive layout without page overflow: ${width}px`)
  }
  await page.setViewportSize({ width: 375, height: 812 })
  await visit('home', 'The right intelligence. For every idea.')
  await page.getByRole('button', { name: t('Open navigation') }).click()
  await page.getByRole('dialog').getByRole('link', { name: t('Open workspace'), exact: true }).click()
  await heading('A good day to build, Alex.').waitFor()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  checks.push('mobile navigation opens, routes and dismisses')
  await visit('home', 'The right intelligence. For every idea.')
  await page.screenshot({ path: path.join(output, 'home-mobile.png'), fullPage: true })
  await chooseOption('Interface language', 'ru')
  language = 'ru'
  await heading('The right intelligence. For every idea.').waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'Russian homepage overflows on mobile')
  await page.screenshot({ path: path.join(output, 'home-russian-mobile.png'), fullPage: true })
  checks.push('long Russian copy fits a 375px viewport')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const motion = await page.locator('.hero-preview').evaluate((element) => getComputedStyle(element).transitionDuration)
  assert.ok(motion.split(',').every((duration) => parseFloat(duration) < 0.01))
  checks.push('reduced motion honored')
  assert.deepEqual(businessRequests, [], 'Demo must not issue live business API requests')
  assert.deepEqual(errors, [], 'Browser runtime errors')
  const report = { checks, count: checks.length, routeCount: routes.length + 7, errors, businessRequests, browser: await browser.version() }
  fs.writeFileSync(path.join(output, 'browser-verification.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
}
main().catch(async (error) => { console.error(error); if (runningBrowser) { const page = runningBrowser.contexts()[0]?.pages()[0]; if (page) { console.log((await page.locator('body').innerText()).slice(-5000)); await page.screenshot({ path: path.join(output, 'failure.png') }) } await runningBrowser.close() } process.exitCode = 1 })
