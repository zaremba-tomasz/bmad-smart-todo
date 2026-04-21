# Security Review -- smart-todo

**Date:** 2026-04-21
**Scope:** Full codebase, OWASP-aligned, common web + API vulnerabilities
**Reviewer:** Automated adversarial review (Blind Hunter + Edge Case Hunter)

---

## Summary

8 findings -- 2 **patch**, 4 **defer**, 2 **dismissed**.
0 critical.

The codebase has a solid security foundation: RLS is correctly configured, auth uses server-side JWT verification, input validation via Zod is consistent, and Svelte's default escaping prevents stored XSS. The gaps below are hardening items for production readiness.

---

## Patch Findings

### PATCH-1: No max-length on user-supplied strings -- denial-of-wallet / abuse risk

| | |
|---|---|
| **Severity** | Medium-High |
| **Location** | `packages/shared/src/schemas/extraction.ts:4`, `packages/shared/src/schemas/task.ts:6,9,10` |

`ExtractRequestSchema.text` is `z.string().min(1)` with no `.max()`. That text is forwarded verbatim to OpenRouter. An attacker with a valid token can send megabytes per request, causing denial-of-wallet (LLM token billing) and memory pressure. Similarly, `CreateTaskRequestSchema` fields (`title`, `location`) have no upper bound.

**Remediation:**

```typescript
// packages/shared/src/schemas/extraction.ts
export const ExtractRequestSchema = z.object({
  text: z.string().min(1).max(2000),
})

// packages/shared/src/schemas/task.ts
title: z.string().min(1).max(500),
location: z.string().max(500).nullable(),
```

Also consider setting an explicit `bodyLimit` on the Fastify extract route:

```typescript
fastify.post('/api/extract', {
  config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  bodyLimit: 8192,
}, async (request, reply) => { ... })
```

---

### PATCH-2: Raw database error messages leaked to clients

| | |
|---|---|
| **Severity** | Medium |
| **Location** | `apps/api/src/routes/tasks.ts:63,99,159,215` |

When Supabase queries fail, the raw `error.message` is returned to the client. This can reveal internal DB schema details, constraint names, or Postgres error specifics to an attacker probing the API.

**Remediation:** Log the real error server-side, return a generic message to the client:

```typescript
if (error) {
  request.log.error({ err: error }, 'Database query failed')
  return reply.status(500).send({
    error: { code: ErrorCode.enum.SERVER_ERROR, message: 'An internal error occurred' },
  })
}
```

---

## Deferred Findings

### DEFER-1: No CORS configuration

| | |
|---|---|
| **Severity** | Medium |
| **Location** | `apps/api/src/server.ts` |

No `@fastify/cors` is registered. Locally the Vite proxy makes everything same-origin, but a production split-origin deployment has no explicit origin allowlist.

**Remediation (when deploying to production):**

```typescript
import cors from '@fastify/cors'

fastify.register(cors, {
  origin: [process.env.WEB_ORIGIN ?? 'http://localhost:5173'],
  credentials: true,
})
```

---

### DEFER-2: No security headers (Helmet)

| | |
|---|---|
| **Severity** | Medium |
| **Location** | `apps/api/src/server.ts` |

The API sets no security headers (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, `Content-Security-Policy`).

**Remediation (when deploying to production):**

```typescript
import helmet from '@fastify/helmet'
fastify.register(helmet)
```

---

### DEFER-3: No rate limiting on task CRUD endpoints

| | |
|---|---|
| **Severity** | Low-Medium |
| **Location** | `apps/api/src/server.ts:27-28` |

Rate limiting is `global: false` and only applied to `/api/extract`. Task creation/completion has no rate limiting. A compromised token holder could create thousands of tasks rapidly.

**Remediation:**

```typescript
fastify.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.userId ?? request.ip,
})
```

---

### DEFER-4: LLM prompt injection via user text

| | |
|---|---|
| **Severity** | Low-Medium |
| **Location** | `apps/api/src/services/openrouter.ts:55`, `apps/api/src/services/lm-studio.ts:39` |

User text is passed directly as the `user` message content to the LLM. While the response is Zod-validated (which limits the blast radius), a crafted input could manipulate extracted fields. The `data_collection: 'deny'` flag on OpenRouter is a good privacy measure.

**Remediation:** Current mitigations (Zod schema enforcement, structured output mode) are reasonable. For additional hardening: sanitize HTML/script tags from extracted `title` before storage, and consider a content-length guard on LLM responses.

---

## Dismissed

| # | Finding | Reason |
|---|---------|--------|
| D1 | `config.json` exposes Supabase anon key | By design -- Supabase anon key is public; RLS policies deny anon access to `tasks` table. Secure as-is. |
| D2 | Auth verification cache (60s TTL) delays token revocation | Acceptable trade-off. 60s window is standard for non-critical apps. |

---

## Positive Findings (Not Vulnerable)

| Area | Detail |
|------|--------|
| **RLS** | Properly configured with per-operation `authenticated` policies and blanket `anon` deny. |
| **Auth** | Server-side `getUser()` verification (not just local JWT decode), user-scoped Supabase client per request. |
| **IDOR** | `user_id` injected from `request.userId` (server-set), not from the request body. Combined with RLS, prevents horizontal privilege escalation. |
| **XSS** | No `{@html}` usage in Svelte templates. All user content is auto-escaped. |
| **SQL injection** | Supabase query builder with parameterized queries. No raw SQL in application code. |
| **Secret management** | `.env` files properly gitignored, `.env.example` contains no values. |
| **Input validation** | Zod schemas on all API inputs; responses also Zod-validated. |
