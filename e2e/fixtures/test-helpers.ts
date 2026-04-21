import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from './test-data'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const TEST_PASSWORD = 'test-password-e2e-123!'

async function ensureTestUser(email: string) {
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const user = existing?.users?.find((u) => u.email === email)

  if (!user) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) throw new Error(`Failed to create test user: ${error.message}`)
  }
}

/**
 * Generates a valid Supabase session for the given test user and injects it
 * into the browser's localStorage so the app recognises the user as
 * authenticated. Uses password-based auth to avoid OTP token conflicts
 * when tests run in parallel.
 */
export async function loginAsTestUser(page: Page, email: string): Promise<string> {
  await ensureTestUser(email)

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })

  if (error || !data.session) {
    throw new Error(
      `Failed to sign in: ${error?.message ?? 'no session'}`,
    )
  }

  const session = data.session

  await page.evaluate(
    ({ url, sess }) => {
      const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
      localStorage.setItem(storageKey, JSON.stringify(sess))
    },
    { url: SUPABASE_URL, sess: session },
  )

  return session.access_token
}

/**
 * Completes a real Supabase magic-link login by generating an admin link and
 * navigating the browser through the auth callback.
 */
export async function loginViaMagicLink(page: Page, email: string): Promise<void> {
  await ensureTestUser(email)

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: 'http://localhost:5173' },
  })

  if (error) {
    throw new Error(`Failed to generate magic link: ${error.message}`)
  }

  const actionLink = data.properties?.action_link
  if (!actionLink) {
    throw new Error('Magic link generation returned no action link')
  }

  await page.goto(actionLink)
  await page.waitForURL(/localhost:5173/, { timeout: 15_000 })
}

export interface TaskPayload {
  title: string
  dueDate: string | null
  dueTime: string | null
  location: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent' | null
  groupId: string | null
}

/**
 * Creates a task via the API directly.
 */
export async function createTaskViaApi(
  accessToken: string,
  taskData: TaskPayload,
): Promise<Record<string, unknown>> {
  const res = await fetch('http://localhost:3001/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(taskData),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`createTaskViaApi failed (${res.status}): ${body}`)
  }

  const json = await res.json()
  return json.data
}

/**
 * Waits for a task with the given title to appear in the task list.
 */
export async function waitForTaskInList(
  page: Page,
  title: string,
): Promise<void> {
  await page
    .locator('[role="list"][aria-label="Task list"]')
    .getByText(title)
    .first()
    .waitFor({ state: 'visible', timeout: 10_000 })
}

/**
 * Runs an axe-core accessibility scan with WCAG 2.1 AA tags.
 * Excludes known pre-existing color contrast issues with tertiary text elements.
 */
export async function runAccessibilityScan(
  page: Page,
  options?: { exclude?: string[] },
) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa'])

  if (options?.exclude) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector)
    }
  }

  return builder.analyze()
}

/**
 * Soft-deletes all tasks for a user by setting deleted_at via the admin client.
 */
export async function deleteAllTasksForUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw new Error(`Failed to clean up tasks: ${error.message}`)
  }
}

/**
 * Gets the user ID from an access token.
 */
export async function getUserIdFromToken(accessToken: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
  if (error || !data.user) {
    throw new Error(`Failed to get user: ${error?.message ?? 'no user'}`)
  }
  return data.user.id
}

/**
 * Clears localStorage and ensures a clean browser state.
 */
export async function cleanupTestData(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear())
}
