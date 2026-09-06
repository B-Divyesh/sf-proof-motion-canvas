import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const path of ['/', '/demo', '/privacy/', '/terms/', '/404.html']) {
  test(`has no serious accessibility violations at ${path}`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(path)
    const results = await new AxeBuilder({ page }).analyze()
    const severe = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    expect(severe, severe.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
    expect(errors).toEqual([])
  })
}

test('publishes complete metadata and working internal links on every route', async ({ page, request }) => {
  for (const path of ['/', '/demo', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.png$/)
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('sizes', '180x180')

    const hrefs = await page.locator('a[href]').evaluateAll((links) => [...new Set(links.map((link) => (link as HTMLAnchorElement).href).filter((href) => href.startsWith(location.origin)))])
    for (const href of hrefs) {
      const response = await request.get(href)
      expect(response.status(), `${href} should resolve`).toBeLessThan(400)
    }
  }
})
