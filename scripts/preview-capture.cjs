const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

async function main() {
  const browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true, chromiumSandbox: true, args: ['--disable-dev-shm-usage'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  const base = process.env.BASE_URL || 'http://host.docker.internal:4174'
  const output = path.resolve(__dirname, '../artifacts')
  fs.mkdirSync(output, { recursive: true })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(output, 'home-desktop.png'), fullPage: true })
  console.log(JSON.stringify({ title: await page.title(), heading: await page.locator('h1').allTextContents(), errors, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) }))
  await page.goto(`${base}/#/console`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { level: 1, name: 'Alex，今天也适合创造。' }).waitFor()
  await page.screenshot({ path: path.join(output, 'console-desktop.png'), fullPage: true })
  console.log(JSON.stringify({ consoleHeading: await page.locator('h1').allTextContents(), errors }))
  await browser.close()
  if (errors.length) process.exitCode = 1
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
