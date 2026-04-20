import type { SupabaseClient } from '@supabase/supabase-js'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
    supabaseClient: SupabaseClient
  }
}
