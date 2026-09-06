import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const sampleTitle = 'Why the sum stays constant'

test('@claim:demo-isolation keeps sample work separate and resets it', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('proof-motion-canvas.document.v1', JSON.stringify({
      version: 1,
      title: 'REAL DATA SENTINEL',
      invariant: 'This is the real draft.',
      nodes: [],
      arrows: [],
      steps: [],
    }))
  })
  await page.goto('/demo')
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.locator('#document-title')).toHaveValue(sampleTitle)
  await expect(page.locator('#claim-list .claim-item')).toHaveCount(5)
  await expect(page.locator('#timecode')).toContainText('/ 11.0 s')

  await page.locator('#document-title').fill('Changed only in demo')
  await page.locator('#document-title').blur()
  const storage = await page.evaluate(() => ({
    real: JSON.parse(localStorage.getItem('proof-motion-canvas.document.v1') ?? '{}').title,
    demoKeys: Object.keys(sessionStorage).filter((key) => key.startsWith('demo:')),
  }))
  expect(storage.real).toBe('REAL DATA SENTINEL')
  expect(storage.demoKeys).toContain('demo:proof-motion-canvas.active')

  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.locator('#document-title')).toHaveValue(sampleTitle)
  await page.getByRole('button', { name: 'Start for real' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('#document-title')).toHaveValue('REAL DATA SENTINEL')
})

test('@claim:local-only sends no author content away during the demo flow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one network capture is enough')
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto('/demo')
  await page.locator('[data-select-step="s1"]').click()
  await page.locator('#edit-step-text').fill('Private edited explanation')
  await page.locator('#edit-step-text').blur()
  await page.getByRole('button', { name: /Play proof/ }).click()
  await page.getByRole('button', { name: /Pause proof/ }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export replay' }).click()
  await downloadEvent
  expect([...new Set(requests.map((url) => new URL(url).origin))]).toEqual(['http://127.0.0.1:4173'])
})

test('@claim:offline-reload reloads the sample after a first visit', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one isolated offline context is enough')
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' })
  const page = await context.newPage()
  await page.goto('/demo')
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('h1')).toHaveText('Inspect a sample animated explanation')
  await expect(page.locator('#claim-list .claim-item')).toHaveCount(5)
  await expect(page.locator('#offline-banner')).toBeVisible()
  await context.close()
})

test('@claim:offline-edit-export edits and exports while offline', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one isolated offline context is enough')
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', acceptDownloads: true })
  const page = await context.newPage()
  await page.goto('/demo')
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null)
  await context.setOffline(true)
  await page.reload()
  await page.locator('#document-title').fill('Offline sample edit')
  await page.locator('#document-title').blur()
  await expect(page.locator('#document-title')).toHaveValue('Offline sample edit')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export replay' }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('offline-sample-edit.html')
  expect(await readFile(await download.path() as string, 'utf8')).toContain('Offline sample edit')
  await context.close()
})

test('@claim:standalone-export creates one self-contained replay file', async ({ page }) => {
  await page.goto('/demo')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export replay' }).click()
  const download = await downloadEvent
  const html = await readFile(await download.path() as string, 'utf8')
  expect(html).toContain(sampleTitle)
  expect(html).toContain('Count both groups')
  expect(html).not.toMatch(/https?:\/\//)
  expect(html).not.toMatch(/<(script|link)[^>]+(?:src|href)=/i)
  await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await expect(page.locator('#claimTitle')).toHaveText('Count both groups')
  await page.getByRole('button', { name: 'Play' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
})

test('@claim:keyboard-controls moves an item and controls playback', async ({ page }) => {
  await page.goto('/demo')
  const card = page.locator('[data-select-node="left"]')
  await card.focus()
  const before = await card.evaluate((element) => getComputedStyle(element).left)
  await page.keyboard.press('ArrowRight')
  const after = await page.locator('[data-select-node="left"]').evaluate((element) => getComputedStyle(element).left)
  expect(after).not.toBe(before)
  await page.locator('#canvas').focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /Pause proof/ })).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /Play proof/ })).toBeVisible()
})

test('@claim:reduced-motion removes narrative movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/demo')
  await page.locator('[data-select-step="s2"]').click()
  const motion = await page.locator('.canvas-node').first().evaluate((element) => {
    const style = getComputedStyle(element)
    return { animation: style.animationDuration, transition: style.transitionDuration }
  })
  expect(parseFloat(motion.animation)).toBeLessThanOrEqual(0.01)
  expect(parseFloat(motion.transition)).toBeLessThanOrEqual(0.01)
})

test('@claim:written-text keeps the explanation visible with motion', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.locator('#current-claim-title')).toHaveText('Count both groups')
  await expect(page.locator('#current-claim-text')).toContainText('eight altogether')
  await page.getByRole('button', { name: 'Next claim' }).click()
  await expect(page.locator('#current-claim-title')).toHaveText('Move one counter')
  await expect(page.locator('#current-claim-text')).toContainText('crosses from the left group')
})

test('@claim:mobile-layout keeps the page and controls usable at 390 pixels', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile outcome uses the phone project')
  await page.goto('/demo')
  const metrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: innerWidth,
    stage: document.querySelector('.stage-panel')?.scrollWidth ?? 0,
    targets: [...document.querySelectorAll<HTMLElement>('button, a')].filter((element) => element.offsetParent !== null).map((element) => ({
      name: element.getAttribute('aria-label') || element.textContent?.trim(),
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    })).filter((target) => target.width < 44 || target.height < 44),
  }))
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport)
  expect(metrics.stage).toBeGreaterThan(metrics.viewport)
  expect(metrics.targets).toEqual([])
  await expect(page.getByRole('button', { name: /Play proof/ })).toBeVisible()
})

test('@claim:free-core completes the main job without a checkout', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByText('Free to use.')).toHaveCount(0)
  await page.locator('[data-select-step="s1"]').click()
  await page.locator('#edit-step-title').fill('A free edited claim')
  await page.locator('#edit-step-title').blur()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export replay' }).click()
  const download = await downloadEvent
  expect(await readFile(await download.path() as string, 'utf8')).toContain('A free edited claim')
  await expect(page.getByRole('link', { name: /checkout|buy|subscribe/i })).toHaveCount(0)
})

test('@claim:timed-intervals shows and exports reconciled timing', async ({ page }) => {
  await page.goto('/demo')
  await page.locator('[data-select-step="s1"]').click()
  const end = page.locator('#edit-step-end')
  await end.fill('5')
  await end.press('Tab')
  await expect(end).toHaveValue('5')
  await expect(page.locator('#step-duration')).toContainText('Duration: 5.00 s.')
  await expect(page.locator('.timeline')).toContainText('0.0–5.0 s')
  await end.fill('0')
  await end.press('Tab')
  await expect(end).toHaveValue('0.25')
  await expect(page.locator('#step-duration')).toContainText('Duration: 0.25 s.')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export replay' }).click()
  expect(await readFile(await (await downloadEvent).path() as string, 'utf8')).toContain('"end":0.25')
})

test('@claim:json-roundtrip restores an editable JSON document', async ({ page }) => {
  await page.goto('/demo')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  const downloaded = await downloadEvent
  const data = JSON.parse(await readFile(await downloaded.path() as string, 'utf8'))
  data.title = 'Imported sample copy'
  await page.locator('#file-input').setInputFiles({ name: 'sample-copy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  await expect(page.locator('#document-title')).toHaveValue('Imported sample copy')
  await expect(page.locator('#claim-list .claim-item')).toHaveCount(5)
})

test('@claim:storage-control clears the real draft with site storage', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Start for real' }).click()
  await page.locator('#document-title').fill('Temporary real draft')
  await page.locator('#document-title').blur()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('proof-motion-canvas.document.v1'))).toContain('Temporary real draft')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.locator('#document-title')).toHaveValue('Untitled argument')
  await expect(page.locator('.canvas-node')).toHaveCount(0)
})
