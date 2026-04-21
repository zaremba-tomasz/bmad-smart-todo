import { expect, test } from '@playwright/test'

import { extractionResponse, TEST_EMAILS } from '../fixtures/test-data'
import {
  cleanupTestData,
  deleteAllTasksForUser,
  getUserIdFromToken,
  loginAsTestUser,
  waitForTaskInList,
} from '../fixtures/test-helpers'

const EMAIL = TEST_EMAILS.capture

test.describe('Capture Loop', () => {
  let accessToken: string

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanupTestData(page)
    accessToken = await loginAsTestUser(page, EMAIL)
    const userId = await getUserIdFromToken(accessToken)
    await deleteAllTasksForUser(userId)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test('type text → extraction form appears with populated fields', async ({ page }) => {
    await page.route('**/api/extract', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(extractionResponse),
      })
    })

    const input = page.getByLabel('Add a task').first()
    await input.fill('Call the dentist next Monday high priority')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()
    await expect(form.locator('#ef-title')).toHaveValue('Call the dentist')
  })

  test('edit an extracted field → save → task appears with edited value', async ({ page }) => {
    await page.route('**/api/extract', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(extractionResponse),
      })
    })

    const input = page.getByLabel('Add a task').first()
    await input.fill('Call the dentist')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()

    const titleInput = form.locator('#ef-title')
    await titleInput.clear()
    await titleInput.fill('Call the doctor')

    await form.getByRole('button', { name: 'Save' }).click()

    await waitForTaskInList(page, 'Call the doctor')
  })

  test('save clears CaptureInput and persists extracted metadata', async ({ page }) => {
    const richExtractionResponse = {
      data: {
        title: 'Call the dentist',
        dueDate: '2030-12-31',
        dueTime: null,
        location: 'Downtown Office',
        priority: 'high' as const,
        recurrence: null,
      },
    }

    await page.route('**/api/extract', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(richExtractionResponse),
      })
    })

    const input = page.getByLabel('Add a task').first()
    await input.fill('Call the dentist')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()

    await form.getByRole('button', { name: 'Save' }).click()

    await waitForTaskInList(page, 'Call the dentist')
    await expect(input).toHaveValue('')
    const taskList = page.locator('[role="list"][aria-label="Task list"]')
    await expect(taskList.getByText('High')).toBeVisible()
    await expect(taskList.getByText('Downtown Office')).toBeVisible()
    await expect(taskList.getByText('Dec 31 2030')).toBeVisible()
  })

  test('"Powered by AI" indicator visible during extraction', async ({ page }) => {
    let releaseExtraction: (() => void) | undefined
    const extractionGate = new Promise<void>((resolve) => {
      releaseExtraction = resolve
    })

    await page.route('**/api/extract', async (route) => {
      await extractionGate
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(extractionResponse),
      })
    })

    const input = page.getByLabel('Add a task').first()
    await input.fill('Call the dentist')
    await input.press('Enter')

    await expect(page.getByTestId('ai-indicator')).toBeVisible()
    releaseExtraction?.()
    await expect(page.getByRole('form', { name: 'Extracted task details' })).toBeVisible()
  })

  test('rapid sequential capture — both tasks appear in list', async ({ page }) => {
    let callCount = 0
    await page.route('**/api/extract', async (route) => {
      callCount++
      const title = callCount === 1 ? 'First task' : 'Second task'
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            title,
            dueDate: null,
            dueTime: null,
            location: null,
            priority: 'medium',
            recurrence: null,
          },
        }),
      })
    })

    const input = page.getByLabel('Add a task').first()
    await input.fill('First task for today')
    await input.press('Enter')

    const form = page.getByRole('form', { name: 'Extracted task details' })
    await expect(form).toBeVisible()
    await form.getByRole('button', { name: 'Save' }).click()

    await waitForTaskInList(page, 'First task')

    await input.fill('Second task for tomorrow')
    await input.press('Enter')

    await expect(form).toBeVisible()
    await form.getByRole('button', { name: 'Save' }).click()

    await waitForTaskInList(page, 'Second task')
    await expect(
      page.locator('[role="list"][aria-label="Task list"]').getByText('First task'),
    ).toBeVisible()
  })
})
