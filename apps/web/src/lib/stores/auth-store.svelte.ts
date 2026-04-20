import type { AuthError, Session, User } from '@supabase/supabase-js'

import { getSupabase } from '$lib/supabase'

let user = $state<User | null>(null)
let session = $state<Session | null>(null)
let loading = $state(true)

let initialized = false

function init() {
  if (initialized) return
  initialized = true

  const supabase = getSupabase()
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session = newSession
    user = newSession?.user ?? null
    loading = false
  })
}

export const authStore = {
  get user() { return user },
  get session() { return session },
  get loading() { return loading },

  init,

  async signIn(email: string): Promise<{ error: AuthError | null }> {
    init()
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error }
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await getSupabase().auth.signOut()
    if (!error) {
      session = null
      user = null
    }
    return { error }
  },

  async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    const { data, error } = await getSupabase().auth.refreshSession()
    if (data.session) {
      session = data.session
      user = data.session.user
    } else {
      session = null
      user = null
    }
    return { session: data.session, error }
  },
}
