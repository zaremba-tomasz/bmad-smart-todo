import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getConfig } from './config'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    const config = getConfig()
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase config missing. Ensure public/config.json has SUPABASE_URL and SUPABASE_ANON_KEY.',
      )
    }
    client = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

export function resetSupabaseClient(): void {
  client = null
}
