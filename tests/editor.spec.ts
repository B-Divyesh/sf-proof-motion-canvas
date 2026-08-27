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
  await page.setContent(await readFile(savedPath as string, 'utf8'))
  await expect(page).toHaveTitle(/replay/)
  await expect(page.locator('#claimTitle')).toHaveText('Count both groups')
  await page.getByRole('button', { name: 'Play' }).click()
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

test('mobile layout contains horizontal canvas scrolling without overflowing the page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only assertion')
  await page.goto('/')
  const metrics = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth, stage: document.querySelector('.stage-panel')?.scrollWidth ?? 0 }))
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport)
  expect(metrics.stage).toBeGreaterThan(metrics.viewport)
  await expect(page.getByRole('button', { name: /Play proof/ })).toBeVisible()
})
