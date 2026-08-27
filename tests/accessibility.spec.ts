import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const path of ['/', '/privacy/', '/terms/']) {
  test(`has no serious accessibility violations at ${path}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).analyze()
    const severe = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    expect(severe, severe.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
  })
}
