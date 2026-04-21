import { expect, test } from '@playwright/test'

import { TEST_EMAILS } from '../fixtures/test-data'
import {
  cleanupTestData,
  loginAsTestUser,
  loginViaMagicLink,
} from '../fixtures/test-helpers'

const EMAIL = TEST_EMAILS.auth

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanupTestData(page)
  })

  test('unauthenticated user sees login page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Smart Todo' })).toBeVisible()
  })

  test('authenticated user sees AppLayout', async ({ page }) => {
    await loginViaMagicLink(page, EMAIL)
    await page.goto('/')

    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
    await expect(page.getByLabel('Email address')).not.toBeVisible()
  })

  test('magic-link login flow grants authenticated access', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Email address').fill(EMAIL)
    await page.getByRole('button', { name: 'Send magic link' }).click()
    await expect(page.getByText('We sent a magic link to')).toBeVisible()

    await loginViaMagicLink(page, EMAIL)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
    await expect(page.getByLabel('Email address')).not.toBeVisible()
  })

  test('logout returns to login screen', async ({ page }) => {
    await loginAsTestUser(page, EMAIL)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible()
  })

  test('authenticated session persists across page reload', async ({ page }) => {
    await loginAsTestUser(page, EMAIL)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
    await expect(page.getByLabel('Email address')).not.toBeVisible()
  })
})
