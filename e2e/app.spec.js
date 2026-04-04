import { test, expect } from '@playwright/test'

test('landing page loads with heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h2')).toContainText('Check your grid')
})

test('provider toggle switches between NESCO and DESCO', async ({ page }) => {
  await page.goto('/')
  // Default is NESCO
  const header = page.locator('h1')
  await expect(header).toContainText('NESCO')
  // Click DESCO toggle
  await page.getByText('DESCO', { exact: true }).click()
  await expect(header).toContainText('DESCO')
  // Click back to NESCO
  await page.getByText('NESCO', { exact: true }).click()
  await expect(header).toContainText('NESCO')
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
