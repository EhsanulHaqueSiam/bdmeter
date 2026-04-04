import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('onboarding_done', 'true')
  })
})

test('landing page loads with heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h2')).toContainText('Check your grid')
})

test('single auto-detect input is shown', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('input[inputmode="numeric"]')).toHaveCount(1)
  await expect(page.locator('input[inputmode="numeric"]')).toHaveAttribute('placeholder', 'Account or Meter (8-12)')
})

test('input validation shows valid/invalid state', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('input[inputmode="numeric"]')
  // Type invalid length
  await input.fill('12345')
  await expect(page.locator('text=Invalid length')).toBeVisible()
  // Type valid 8-digit number
  await input.fill('12345678')
  await expect(page.locator('text=Valid')).toBeVisible()
})

test('submit button enables with valid meter number', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('input[inputmode="numeric"]')
  const submitBtn = page.locator('button[type="submit"]')
  // Initially disabled
  await expect(submitBtn).toBeDisabled()
  // Type valid number
  await input.fill('12345678')
  await expect(submitBtn).toBeEnabled()
})
