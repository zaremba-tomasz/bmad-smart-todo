export const SUPABASE_URL = 'http://127.0.0.1:54321'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
export const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export const TEST_EMAILS = {
  auth: 'e2e-auth@example.com',
  capture: 'e2e-capture@example.com',
  manualFallback: 'e2e-manual@example.com',
  completion: 'e2e-completion@example.com',
  taskList: 'e2e-tasklist@example.com',
  accessibility: 'e2e-a11y@example.com',
} as const

export const sampleTask = {
  title: 'Call the dentist',
  dueDate: '2026-05-01',
  dueTime: null,
  location: 'Downtown Office',
  priority: 'high' as const,
  groupId: null,
}

export const sampleTaskUrgent = {
  title: 'Submit tax return',
  dueDate: '2026-04-22',
  dueTime: '09:00',
  location: null,
  priority: 'urgent' as const,
  groupId: null,
}

export const sampleTaskMedium = {
  title: 'Buy groceries',
  dueDate: '2026-05-05',
  dueTime: null,
  location: 'Supermarket',
  priority: 'medium' as const,
  groupId: null,
}

export const sampleTaskLow = {
  title: 'Read a book',
  dueDate: null,
  dueTime: null,
  location: null,
  priority: 'low' as const,
  groupId: null,
}

export const extractionResponse = {
  data: {
    title: 'Call the dentist',
    dueDate: '2026-04-28',
    dueTime: null,
    location: null,
    priority: 'high' as const,
    recurrence: null,
  },
}

export const extractionTimeoutResponse = {
  error: { code: 'EXTRACTION_TIMEOUT', message: 'LLM extraction timed out' },
}
