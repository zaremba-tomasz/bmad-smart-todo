import { expect, test } from '@playwright/test'

import {
  extractionResponse,
  sampleTask,
  sampleTaskLow,
  sampleTaskMedium,
  sampleTaskUrgent,
  TEST_EMAILS,
} from '../fixtures/test-data'
import {
  cleanupTestData,
  createTaskViaApi,
  deleteAllTasksForUser,
  getUserIdFromToken,
  loginAsTestUser,
  waitForTaskInList,
} from '../fixtures/test-helpers'

const EMAIL = TEST_EMAILS.taskList

test.describe('Task List', () => {
  let accessToken: string

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanupTestData(page)
    accessToken = await loginAsTestUser(page, EMAIL)
    const userId = await getUserIdFromToken(accessToken)
    await deleteAllTasksForUser(userId)
  })

  test('empty state — "Your task list is clear." text visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Your task list is clear.')).toBeVisible()
  })

  test('empty state disappears when first task is created', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Your task list is clear.')).toBeVisible()

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
    await form.getByRole('button', { name: 'Save' }).click()

    await waitForTaskInList(page, 'Call the dentist')
    await expect(page.getByText('Your task list is clear.')).not.toBeVisible()
  })

  test('tasks render with correct metadata', async ({ page }) => {
    const metadataTask = {
      ...sampleTask,
      title: 'Metadata task',
      dueDate: '2030-12-31',
      location: 'Downtown Office',
    }
    await createTaskViaApi(accessToken, metadataTask)
    await page.goto('/')
    await waitForTaskInList(page, metadataTask.title)

    const taskList = page.locator('[role="list"][aria-label="Task list"]')
    await expect(taskList.getByText(metadataTask.title)).toBeVisible()
    await expect(taskList.getByText('Dec 31 2030')).toBeVisible()
    await expect(taskList.getByText('High')).toBeVisible()
    await expect(taskList.getByText(metadataTask.location!)).toBeVisible()
  })

  test('sort order — priority first, due-date tiebreaker within same priority', async ({ page }) => {
    const highEarlier = {
      ...sampleTask,
      title: 'High earlier',
      dueDate: '2026-04-20',
    }
    const highLater = {
      ...sampleTask,
      title: 'High later',
      dueDate: '2026-04-29',
    }

    await createTaskViaApi(accessToken, sampleTaskLow)
    await createTaskViaApi(accessToken, sampleTaskMedium)
    await createTaskViaApi(accessToken, highLater)
    await createTaskViaApi(accessToken, highEarlier)
    await createTaskViaApi(accessToken, sampleTaskUrgent)

    await page.goto('/')

    await waitForTaskInList(page, sampleTaskUrgent.title)
    await waitForTaskInList(page, highEarlier.title)
    await waitForTaskInList(page, highLater.title)
    await waitForTaskInList(page, sampleTaskMedium.title)
    await waitForTaskInList(page, sampleTaskLow.title)

    const taskItems = page.locator('[role="list"][aria-label="Task list"] li')
    const count = await taskItems.count()
    const titles: string[] = []
    for (let i = 0; i < count; i++) {
      titles.push(await taskItems.nth(i).innerText())
    }
    const titleText = titles.join('\n')

    const urgentIdx = titleText.indexOf(sampleTaskUrgent.title)
    const highEarlierIdx = titleText.indexOf(highEarlier.title)
    const highLaterIdx = titleText.indexOf(highLater.title)
    const medIdx = titleText.indexOf(sampleTaskMedium.title)
    const lowIdx = titleText.indexOf(sampleTaskLow.title)

    expect(urgentIdx).toBeLessThan(highEarlierIdx)
    expect(highEarlierIdx).toBeLessThan(highLaterIdx)
    expect(highLaterIdx).toBeLessThan(medIdx)
    expect(medIdx).toBeLessThan(lowIdx)
  })

  test('placeholder text visible in CaptureInput', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByPlaceholder('Call the dentist next Monday, high priority').first(),
    ).toBeVisible()
  })
})
