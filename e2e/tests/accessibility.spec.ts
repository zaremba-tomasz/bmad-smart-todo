import { expect, test } from '@playwright/test'

import {
  extractionResponse,
  extractionTimeoutResponse,
  sampleTask,
  TEST_EMAILS,
} from '../fixtures/test-data'
import {
  cleanupTestData,
  createTaskViaApi,
  deleteAllTasksForUser,
  getUserIdFromToken,
  loginAsTestUser,
  runAccessibilityScan,
  waitForTaskInList,
} from '../fixtures/test-helpers'

const EMAIL = TEST_EMAILS.accessibility

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  let accessToken: string

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanupTestData(page)
    accessToken = await loginAsTestUser(page, EMAIL)
    const userId = await getUserIdFromToken(accessToken)
    await deleteAllTasksForUser(userId)
  })

  test('empty state view passes axe-core scan', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Your task list is clear.')).toBeVisible()

    const results = await runAccessibilityScan(page)
    expect(results.violations).toEqual([])
  })

  test('task list view passes axe-core scan', async ({ page }) => {
    await createTaskViaApi(accessToken, sampleTask)
    await page.goto('/')
    await waitForTaskInList(page, sampleTask.title)

    const results = await runAccessibilityScan(page)
    expect(results.violations).toEqual([])
  })

  test('extraction form view passes axe-core scan', async ({ page }) => {
    await page.route('**/api/extract', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(extractionResponse),
      })
    })

    await page.goto('/')
    const input = page.getByLabel('Add a task').first()
    await input.fill('Call the dentist')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()

    const results = await runAccessibilityScan(page)
    expect(results.violations).toEqual([])
  })

  test('manual form view passes axe-core scan', async ({ page }) => {
    await page.route('**/api/extract', async (route) => {
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify(extractionTimeoutResponse),
      })
    })

    await page.goto('/')
    const input = page.getByLabel('Add a task').first()
    await input.fill('Buy groceries')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()
    await expect(form.getByText('Add details yourself')).toBeVisible()

    const results = await runAccessibilityScan(page)
    expect(results.violations).toEqual([])
  })
})
