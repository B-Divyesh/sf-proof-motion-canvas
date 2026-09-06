import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('states the job, audience, and first action before scrolling', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Build an inspectable animated explanation')
  await expect(page.getByText(/For teachers, explainers, and programmers/)).toBeVisible()
  const sampleAction = page.getByRole('link', { name: 'Try it with sample data' })
  await expect(sampleAction).toBeVisible()
  await expect(page.getByText('Free to use.')).toBeVisible()
  await expect(page.getByText('Drafts stay in this browser.')).toBeVisible()
  await expect(page.getByText('Works offline after the first visit.')).toBeVisible()
  const box = await sampleAction.boundingBox()
  expect(box).not.toBeNull()
  expect((box?.y ?? Infinity) + (box?.height ?? 0)).toBeLessThanOrEqual(await page.evaluate(() => innerHeight))
})

test('uses real demo navigation, route metadata, focus, and browser history', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  await expect(page).toHaveURL(/\/demo$/)
  await expect(page).toHaveTitle('Demo — Proof Motion Canvas')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://proof-motion-canvas.sociobot.in/demo')
  await expect(page.locator('#page-title')).toBeFocused()
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('h1')).toHaveText('Build an inspectable animated explanation')
  await expect(page.locator('#page-title')).toBeFocused()
})

test('edits, plays, and exports the sample proof', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/demo')

  await expect(page).toHaveTitle(/Proof Motion Canvas/)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('#claim-list .claim-item')).toHaveCount(5)
  await expect(page.locator('#canvas-empty')).toBeHidden()
  await expect(page.locator('.canvas-node')).toHaveCount(4)

  const firstCard = page.locator('[data-select-node="left"]')
  await firstCard.focus()
  const before = await firstCard.getAttribute('style')
  await page.keyboard.press('ArrowRight')
  await expect(firstCard).not.toHaveAttribute('style', before ?? '')

  await page.getByRole('button', { name: /Play proof/ }).click()
  await expect(page.getByRole('button', { name: /Pause proof/ })).toBeVisible()
  await page.getByRole('button', { name: /Pause proof/ }).click()

  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export replay' }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toMatch(/\.html$/)
  const savedPath = await download.path()
  expect(savedPath).not.toBeNull()
  const exportedHtml = await readFile(savedPath as string, 'utf8')
  await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(exportedHtml)}`)
  await expect(page).toHaveTitle(/replay/)
  await expect(page.locator('#claimTitle')).toHaveText('Count both groups')
  await page.getByRole('button', { name: 'Play' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  expect(errors).toEqual([])
})

test('creates a proof from the empty state', async ({ page }) => {
  await page.goto('/')
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'New draft' }).click()
  await expect(page.getByText('Your canvas has no items')).toBeVisible()
  await page.getByRole('button', { name: /Add claim/ }).click()
  await expect(page.locator('#toast')).toContainText('Add a canvas item before adding a claim.')
  await page.getByRole('button', { name: 'Add first card' }).click()
  await page.locator('#edit-node-label').fill('Starting set')
  await page.locator('#edit-node-label').blur()
  await page.getByRole('button', { name: /Add claim/ }).click()
  await page.locator('#edit-step-title').fill('Name the starting set')
  await page.locator('#edit-step-title').blur()
  await expect(page.locator('#claim-list')).toContainText('Name the starting set')
})

test('manages keyboard focus in the arrow dialog', async ({ page }) => {
  await page.goto('/demo')
  const addArrow = page.getByRole('button', { name: /Arrow/ })
  await addArrow.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#arrow-dialog')).toBeVisible()
  await expect(page.locator('#arrow-from')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('#arrow-dialog')).toBeHidden()
  await expect(addArrow).toBeFocused()
})

test('keeps keyboard focus from a claim name through its accessible explanation and standalone export', async ({ page }) => {
  await page.goto('/demo')
  await page.locator('[data-select-step="s1"]').click()

  const title = page.locator('#edit-step-title')
  const explanation = page.locator('#edit-step-text')
  await title.fill('My invariant')
  await title.press('Tab')
  await expect(explanation).toBeFocused()

  const accessibleText = 'Changing a card does not change the total count.'
  await explanation.fill(accessibleText)
  await explanation.press('Tab')
  await expect(page.locator('#claim-list')).toContainText('My invariant')
  await expect(page.locator('.canvas-node')).toHaveCount(4)

  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export replay' }).click()
  const download = await downloadEvent
  const savedPath = await download.path()
  expect(savedPath).not.toBeNull()
  const exportedHtml = await readFile(savedPath as string, 'utf8')
  await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(exportedHtml)}`)
  await expect(page.locator('#claimTitle')).toHaveText('My invariant')
  await expect(page.locator('#claimText')).toHaveText(accessibleText)
})

test('reconciles the inspectable duration and timing fields after valid and clamped timing edits', async ({ page }) => {
  await page.goto('/demo')
  await page.locator('[data-select-step="s1"]').click()

  const end = page.locator('#edit-step-end')
  await end.fill('5')
  await end.press('Tab')
  await expect(end).toHaveValue('5')
  await expect(page.locator('#step-duration')).toHaveText(/Duration: 5\.00 s\./)
  await expect(page.locator('.timeline')).toContainText('1. Count both groups0.0–5.0 s')

  await page.locator('[data-select-step="s1"]').click()
  await end.fill('0')
  await end.press('Tab')
  await expect(end).toHaveValue('0.25')
  await expect(page.locator('#step-duration')).toHaveText(/Duration: 0\.25 s\./)
  await expect(page.locator('.timeline')).toContainText('1. Count both groups0.0–0.3 s')

  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export replay' }).click()
  const download = await downloadEvent
  const savedPath = await download.path()
  expect(savedPath).not.toBeNull()
  expect(await readFile(savedPath as string, 'utf8')).toContain('"end":0.25')
})

test('rejects malformed imports before they can corrupt the local proof', async ({ page }) => {
  await page.goto('/demo')
  const fileInput = page.locator('#file-input')
  const duplicateStepIds = {
    version: 1,
    title: 'Duplicate id recovery',
    invariant: 'x',
    nodes: [{ id: 'n1', kind: 'card', label: 'A', x: 20, y: 30 }],
    arrows: [],
    steps: [
      { id: 'same', title: 'First claim', text: 'first', targetId: 'n1', start: 0, end: 1 },
      { id: 'same', title: 'Second claim', text: 'second', targetId: 'n1', start: 1, end: 2 },
    ],
  }
  await fileInput.setInputFiles({ name: 'duplicate-ids.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(duplicateStepIds)) })
  await expect(page.locator('#toast')).toContainText('same identity')
  await expect(page.locator('#claim-list .claim-item')).toHaveCount(5)

  const offCanvasNode = {
    ...duplicateStepIds,
    steps: duplicateStepIds.steps.slice(0, 1),
    nodes: [{ id: 'n1', kind: 'card', label: 'A', x: -999, y: 999 }],
  }
  await fileInput.setInputFiles({ name: 'off-canvas.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(offCanvasNode)) })
  await expect(page.locator('#toast')).toContainText('must stay within')
  await expect(page.locator('[data-select-node="left"]')).toBeVisible()
})

test('mobile layout contains horizontal canvas scrolling without overflowing the page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only assertion')
  await page.goto('/demo')
  const metrics = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth, stage: document.querySelector('.stage-panel')?.scrollWidth ?? 0 }))
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport)
  expect(metrics.stage).toBeGreaterThan(metrics.viewport)
  await expect(page.getByRole('button', { name: /Play proof/ })).toBeVisible()
})

test('keeps the editor available offline after the first visit', async ({ page, context }) => {
  await page.goto('/demo')
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('h1')).toHaveText('Inspect a sample animated explanation')
  await expect(page.locator('#offline-banner')).toBeVisible()
  await context.setOffline(false)
})

test('keeps every visible legal-page link at least 44 pixels high', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'touch target check uses the phone project')
  for (const path of ['/privacy/', '/terms/', '/404.html']) {
    await page.goto(path)
    const undersized = await page.locator('a').evaluateAll((links) => links.filter((link) => (link as HTMLElement).offsetParent !== null).map((link) => ({
      text: link.textContent?.trim(),
      width: link.getBoundingClientRect().width,
      height: link.getBoundingClientRect().height,
    })).filter((link) => link.width < 44 || link.height < 44))
    expect(undersized, `${path} has undersized links`).toEqual([])
  }
})
