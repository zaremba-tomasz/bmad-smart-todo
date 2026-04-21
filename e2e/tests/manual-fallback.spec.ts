import { expect, test } from '@playwright/test'

import { extractionTimeoutResponse, TEST_EMAILS } from '../fixtures/test-data'
import {
  cleanupTestData,
  deleteAllTasksForUser,
  getUserIdFromToken,
  loginAsTestUser,
  waitForTaskInList,
} from '../fixtures/test-helpers'

const EMAIL = TEST_EMAILS.manualFallback

test.describe('Manual Fallback', () => {
  let accessToken: string

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanupTestData(page)
    accessToken = await loginAsTestUser(page, EMAIL)
    const userId = await getUserIdFromToken(accessToken)
    await deleteAllTasksForUser(userId)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.route('**/api/extract', async (route) => {
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify(extractionTimeoutResponse),
      })
    })
  })

  test('extraction timeout shows manual form with title pre-populated', async ({ page }) => {
    const input = page.getByLabel('Add a task').first()
    await input.fill('Buy groceries at the store')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()
    await expect(form.locator('#ef-title')).toHaveValue('Buy groceries at the store')
  })

  test('"Add details yourself" label visible on manual form', async ({ page }) => {
    const input = page.getByLabel('Add a task').first()
    await input.fill('Buy groceries')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()
    await expect(form.getByText('Add details yourself')).toBeVisible()
  })

  test('fill manual form fields → save → task appears with all fields', async ({ page }) => {
    const input = page.getByLabel('Add a task').first()
    await input.fill('Buy groceries')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()

    const addDateBtn = form.getByRole('button', { name: '+ Add date' })
    if (await addDateBtn.isVisible()) {
      await addDateBtn.click()
    }
    await form.locator('#ef-date').fill('2026-05-01')

    const addPriorityBtn = form.getByRole('button', { name: '+ Add priority' })
    if (await addPriorityBtn.isVisible()) {
      await addPriorityBtn.click()
    }
    await form.getByRole('button', { name: 'High' }).click()

    const addLocationBtn = form.getByRole('button', { name: '+ Add location' })
    if (await addLocationBtn.isVisible()) {
      await addLocationBtn.click()
    }
    await form.locator('#ef-location').fill('Supermarket')

    await form.getByRole('button', { name: 'Save' }).click()

    await waitForTaskInList(page, 'Buy groceries')

    const taskList = page.locator('[role="list"][aria-label="Task list"]')
    await expect(taskList.getByText('Supermarket')).toBeVisible()
    await expect(taskList.getByText('High')).toBeVisible()
  })

  test('manual form has same Save button as extraction form', async ({ page }) => {
    const input = page.getByLabel('Add a task').first()
    await input.fill('Some task')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()
    await expect(form.getByRole('button', { name: 'Save' })).toBeVisible()
  })
})
