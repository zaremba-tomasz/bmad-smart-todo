import { getTestSupabaseAdmin, setIntegrationEnv } from './integration-helpers.js'

export async function setup() {
  setIntegrationEnv()

  const admin = getTestSupabaseAdmin()
  const { error } = await admin.from('tasks').select('id').limit(1)
  if (error) {
    throw new Error(
      `Supabase is not reachable. Ensure \`supabase start\` is running.\n${error.message}`,
    )
  }
}
