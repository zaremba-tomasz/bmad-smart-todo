import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const TEST_PASSWORD = 'integration-test-pwd-123!'

let adminClient: SupabaseClient | null = null

export function getTestSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  }
  return adminClient
}

export async function createTestUser(email: string): Promise<string> {
  const admin = getTestSupabaseAdmin()

  const { data: existing } = await admin.auth.admin.listUsers()
  const existingUser = existing?.users?.find((u) => u.email === email)
  if (existingUser) return existingUser.id

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create test user ${email}: ${error.message}`)
  return data.user.id
}

export async function getTestUserToken(email: string): Promise<string> {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })
  if (error || !data.session) {
    throw new Error(`Failed to sign in ${email}: ${error?.message ?? 'no session'}`)
  }
  return data.session.access_token
}

export async function cleanupTestTasks(userId: string): Promise<void> {
  const admin = getTestSupabaseAdmin()
  const { error } = await admin
    .from('tasks')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to clean up tasks for ${userId}: ${error.message}`)
  }
}

export async function cleanupTestUser(email: string): Promise<void> {
  const admin = getTestSupabaseAdmin()
  const { data: users } = await admin.auth.admin.listUsers()
  const user = users?.users?.find((u) => u.email === email)
  if (user) {
    await admin.auth.admin.deleteUser(user.id)
  }
}

export function setIntegrationEnv(): void {
  process.env.SUPABASE_URL = SUPABASE_URL
  process.env.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY
  process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY
}
