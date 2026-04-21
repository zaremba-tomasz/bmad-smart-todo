import { expect, test } from '@playwright/test'

import { sampleTask, sampleTaskMedium, TEST_EMAILS } from '../fixtures/test-data'
import {
  cleanupTestData,
  createTaskViaApi,
  deleteAllTasksForUser,
  getUserIdFromToken,
  loginAsTestUser,
  waitForTaskInList,
} from '../fixtures/test-helpers'

const EMAIL = TEST_EMAILS.completion

test.describe('Task Completion', () => {
  let accessToken: string

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanupTestData(page)
    accessToken = await loginAsTestUser(page, EMAIL)
    const userId = await getUserIdFromToken(accessToken)
    await deleteAllTasksForUser(userId)
  })

  test('mark task complete — visual treatment visible', async ({ page }) => {
    await createTaskViaApi(accessToken, sampleTask)
    await page.goto('/')
    await waitForTaskInList(page, sampleTask.title)

    const checkbox = page.getByRole('checkbox', {
      name: new RegExp(`Mark ${sampleTask.title} as complete`),
    })
    await checkbox.click()

    const completedTask = page.locator('.task-item', { hasText: sampleTask.title }).first()
    await expect(completedTask).toHaveClass(/bg-surface-completed/)
    await expect(completedTask.locator('p', { hasText: sampleTask.title })).toHaveClass(
      /text-text-tertiary/,
    )
    await expect(page.getByText(/1\s+completed/)).toBeVisible()
  })

  test('unmark completed task — returns to open state', async ({ page }) => {
    await createTaskViaApi(accessToken, sampleTask)
    await page.goto('/')
    await waitForTaskInList(page, sampleTask.title)

    const checkbox = page.getByRole('checkbox', {
      name: new RegExp(`Mark ${sampleTask.title} as complete`),
    })
    await checkbox.click()
    await expect(page.getByText(/1\s+completed/)).toBeVisible()

    const uncheckBox = page.getByRole('checkbox', {
      name: new RegExp(`Mark ${sampleTask.title} as incomplete`),
    })
    await uncheckBox.click()

    await expect(page.getByText(/completed/)).not.toBeVisible()
  })

  test('multiple rapid completions work correctly', async ({ page }) => {
    await createTaskViaApi(accessToken, sampleTask)
    await createTaskViaApi(accessToken, sampleTaskMedium)
    await page.goto('/')

    await waitForTaskInList(page, sampleTask.title)
    await waitForTaskInList(page, sampleTaskMedium.title)

    const checkbox1 = page.getByRole('checkbox', {
      name: new RegExp(`Mark ${sampleTask.title} as complete`),
    })
    await checkbox1.click()

    const checkbox2 = page.getByRole('checkbox', {
      name: new RegExp(`Mark ${sampleTaskMedium.title} as complete`),
    })
    await checkbox2.click()

    await expect(page.getByText(/2\s+completed/)).toBeVisible()
  })

  test('completed count increments after marking complete', async ({ page }) => {
    await createTaskViaApi(accessToken, sampleTask)
    await page.goto('/')
    await waitForTaskInList(page, sampleTask.title)

    await expect(page.getByText(/completed/)).not.toBeVisible()

    const checkbox = page.getByRole('checkbox', {
      name: new RegExp(`Mark ${sampleTask.title} as complete`),
    })
    await checkbox.click()

    await expect(page.getByText(/1\s+completed/)).toBeVisible()
  })
})
