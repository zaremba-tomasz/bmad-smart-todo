interface AppConfig {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
}

let config: AppConfig = {}

export async function loadConfig(): Promise<void> {
  try {
    const response = await fetch('/config.json')
    if (response.ok) {
      config = await response.json()
    }
  } catch {
    // Config load failure is non-fatal in development
  }
}

export function getConfig(): AppConfig {
  return config
}
