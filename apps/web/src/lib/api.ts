import type { ZodType } from 'zod'

import { authStore } from '$lib/stores/auth-store.svelte'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

async function parseErrorBody(res: Response): Promise<{ code: string; message: string }> {
  try {
    const body = await res.json()
    if (body?.error?.code && body?.error?.message) {
      return body.error
    }
  } catch {
    // Non-JSON response
  }
  return { code: 'SERVER_ERROR', message: `Request failed with status ${res.status}` }
}

async function doFetch<T>(
  path: string,
  schema: ZodType<T> | undefined,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  const token = authStore.session?.access_token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(path, { ...options, headers })

  if (res.status === 401) {
    const { session: refreshedSession, error: refreshError } = await authStore.refreshSession()
    if (refreshError || !refreshedSession?.access_token) {
      await authStore.signOut()
      return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } }
    }

    headers['Authorization'] = `Bearer ${refreshedSession.access_token}`
    const retry = await fetch(path, { ...options, headers })
    if (!retry.ok) {
      return { ok: false, error: await parseErrorBody(retry) }
    }
    const retryData = await retry.json()
    const parsed = schema ? schema.parse(retryData) : retryData
    return { ok: true, data: parsed as T }
  }

  if (!res.ok) {
    return { ok: false, error: await parseErrorBody(res) }
  }

  const data = await res.json()
  const parsed = schema ? schema.parse(data) : data
  return { ok: true, data: parsed as T }
}

export const api = {
  async get<T>(path: string, schema?: ZodType<T>): Promise<ApiResult<T>> {
    return doFetch(path, schema, { method: 'GET' })
  },

  async post<T>(path: string, body: unknown, schema?: ZodType<T>): Promise<ApiResult<T>> {
    return doFetch(path, schema, { method: 'POST', body: JSON.stringify(body) })
  },

  async put<T>(path: string, body: unknown, schema?: ZodType<T>): Promise<ApiResult<T>> {
    return doFetch(path, schema, { method: 'PUT', body: JSON.stringify(body) })
  },

  async delete<T>(path: string, schema?: ZodType<T>): Promise<ApiResult<T>> {
    return doFetch(path, schema, { method: 'DELETE' })
  },
}
