import { createHash } from 'node:crypto'

import type { FastifyReply, FastifyRequest } from 'fastify'

import { createSupabaseClient, getSupabaseAdmin } from '../utils/supabase.js'

interface CacheEntry {
  userId: string
  expiresAt: number
}

const verificationCache = new Map<string, CacheEntry>()

const CACHE_TTL_MS = 60_000
const CLEANUP_INTERVAL_MS = 5 * 60_000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function getCacheKey(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function startCacheCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of verificationCache) {
      if (entry.expiresAt <= now) {
        verificationCache.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
  cleanupTimer.unref()
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
    })
  }

  const token = authHeader.slice(7)
  if (!token) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Missing token' },
    })
  }

  const cacheKey = getCacheKey(token)
  const cached = verificationCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    request.userId = cached.userId
    request.supabaseClient = createSupabaseClient(token)
    return
  }

  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)

  if (error || !user) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    })
  }

  verificationCache.set(cacheKey, { userId: user.id, expiresAt: Date.now() + CACHE_TTL_MS })
  startCacheCleanup()

  request.userId = user.id
  request.supabaseClient = createSupabaseClient(token)
}

export function clearVerificationCache() {
  verificationCache.clear()
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
}
