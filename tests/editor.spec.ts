import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('edits, plays, and exports the sample proof', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')

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
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByText('Make every claim inspectable.')).toBeVisible()
  await page.getByRole('button', { name: 'Add first card' }).click()
  await page.locator('#edit-node-label').fill('Starting set')
  await page.locator('#edit-node-label').blur()
  await page.getByRole('button', { name: /Add claim/ }).click()
  await page.locator('#edit-step-title').fill('Name the starting set')
  await page.locator('#edit-step-title').blur()
  await expect(page.locator('#claim-list')).toContainText('Name the starting set')
})

test('rejects malformed imports before they can corrupt the local proof', async ({ page }) => {
  await page.goto('/')
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
  await page.goto('/')
  const metrics = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth, stage: document.querySelector('.stage-panel')?.scrollWidth ?? 0 }))
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport)
  expect(metrics.stage).toBeGreaterThan(metrics.viewport)
  await expect(page.getByRole('button', { name: /Play proof/ })).toBeVisible()
})

test('keeps the editor available offline after the first visit', async ({ page, context }) => {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('h1')).toHaveText('Proof Motion Canvas')
  await expect(page.locator('#offline-banner')).toBeVisible()
  await context.setOffline(false)
})
