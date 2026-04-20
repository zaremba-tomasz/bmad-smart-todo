# Story 1.3: User Login & Session Management

Status: done

## Story

As a user,
I want to log in via a magic link sent to my email and stay logged in across browser sessions,
so that I can access my tasks securely without managing a password.

## Acceptance Criteria

1. **Magic link request:** Given I am not logged in, when I enter my email and submit the login form, then a magic link is sent via Supabase Auth and I see a confirmation message.

2. **Magic link authentication:** Given I received a magic link, when I click it, then I am authenticated, redirected to the app, and my session is established via Supabase Auth SDK.

3. **Session persistence:** Given I am logged in, when I close the browser and reopen the app, then I am still logged in (session persists via Supabase token refresh) and do not need to re-authenticate.

4. **Logout:** Given I am logged in, when I click the logout action, then my session is terminated, I am redirected to the login screen, and I cannot access any data without re-authenticating.

5. **BFF auth middleware:** Given I am logged in, when any API request is made to the Fastify BFF, then the auth middleware verifies my Supabase JWT via `supabase.auth.getUser()`, my `user_id` is extracted exclusively from the verified JWT payload (never from request params/body), and verified tokens are cached in-memory for 60 seconds.

6. **JWT expiry + 401 handling:** Given my JWT has expired, when an API call returns HTTP 401 (UNAUTHORIZED), then the SPA's `authStore` triggers `supabase.auth.refreshSession()`, retries the original request once with the new token, and redirects to login if refresh also fails.

7. **Email allowlist denial:** Given my email is not on the allowlist, when I attempt to sign up or log in, then I am not granted access and I see an appropriate message.

8. **Per-request Supabase client + RLS:** Given I am authenticated, when I query tasks via the API, then a per-request Supabase client is created with my JWT and RLS policies ensure I can only access my own data (FR4).

## Tasks / Subtasks

- [x] Task 1: Add `@supabase/supabase-js` to `apps/web` (AC: #1, #2, #3)
  - [x] 1.1 `pnpm add @supabase/supabase-js` in `apps/web`
  - [x] 1.2 Verify version matches API (`2.103.3`) for consistency

- [x] Task 2: Implement browser Supabase client `apps/web/src/lib/supabase.ts` (AC: #1, #2, #3)
  - [x] 2.1 Replace stub with lazy-initialized `getSupabase()` function (see timing note in Dev Notes)
  - [x] 2.2 Configure auth options: `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`
  - [x] 2.3 Export `getSupabase()` function (not a top-level singleton — lazy init avoids config timing issue)
  - [x] 2.4 Write unit test `supabase.test.ts`

- [x] Task 3: Implement `authStore` at `apps/web/src/lib/stores/auth-store.svelte.ts` (AC: #1, #2, #3, #4, #6)
  - [x] 3.1 Create store with Svelte 5 runes: `$state` for `{ user, session, loading }`
  - [x] 3.2 Subscribe to `supabase.auth.onAuthStateChange` via `init()`
  - [x] 3.3 Expose `signIn(email)` → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`
  - [x] 3.4 Expose `signOut()` → `supabase.auth.signOut()`
  - [x] 3.5 Expose `refreshSession()` → `supabase.auth.refreshSession()`
  - [x] 3.6 Write unit tests `auth-store.test.ts` (mock Supabase client)

- [x] Task 4: Implement typed API client `apps/web/src/lib/api.ts` (AC: #5, #6, #8)
  - [x] 4.1 Replace stub with `ApiResult<T>` discriminated union type
  - [x] 4.2 Read `session.access_token` from `authStore` at call time (never cached at init)
  - [x] 4.3 Set `Authorization: Bearer <jwt>` on every request
  - [x] 4.4 Use relative `/api/*` paths (same-domain via Vite proxy / nginx)
  - [x] 4.5 Implement 401 retry: on UNAUTHORIZED, call `refreshSession()`, retry once, redirect to login on failure
  - [x] 4.6 Zod-validate API responses
  - [x] 4.7 Write unit tests `api.test.ts`

- [x] Task 5: Build login UI in `App.svelte` (AC: #1, #2, #7)
  - [x] 5.1 Convert `App.svelte` to auth gate: show login form when unauthenticated, app placeholder when authenticated
  - [x] 5.2 Login form: email input field + submit button (primary `accent-hot` button style)
  - [x] 5.3 Post-submission: show "Check your email" confirmation message
  - [x] 5.4 Handle `detectSessionInUrl: true` for magic link callback (automatic via SDK)
  - [x] 5.5 Display allowlist-denied message if signInWithOtp returns an error
  - [x] 5.6 Form follows UX spec: visible label, 16px input (prevents iOS zoom), `:focus-visible` ring, inline error below field, no toast
  - [x] 5.7 Add logout button in authenticated view

- [x] Task 6: Implement Fastify auth middleware `apps/api/src/middleware/auth.ts` (AC: #5, #8)
  - [x] 6.1 Create `createSupabaseAdmin()` in `apps/api/src/utils/supabase.ts` (server client with service role for `getUser()` verification)
  - [x] 6.2 Create per-request client factory: `createSupabaseClient(jwt)` using anon key + `Authorization: Bearer` header — this is what routes use for RLS-scoped queries
  - [x] 6.3 Auth middleware: extract Bearer token from `Authorization` header
  - [x] 6.4 Verify JWT via `supabase.auth.getUser(token)` (server-side validation)
  - [x] 6.5 Implement in-memory token verification cache (60s TTL, keyed by token hash)
  - [x] 6.6 On success: decorate `request` with `userId` (from JWT payload) and `supabaseClient` (per-request)
  - [x] 6.7 On failure: return `{ error: { code: "UNAUTHORIZED", message: "..." } }` with HTTP 401
  - [x] 6.8 Register middleware as Fastify `preHandler` hook
  - [x] 6.9 Write unit tests `auth.test.ts` and `supabase.test.ts`

- [x] Task 7: Update `apps/api/src/server.ts` to register auth middleware (AC: #5)
  - [x] 7.1 Import and register auth middleware on all `/api/*` routes except `/api/health`

- [x] Task 8: Verify existing tests pass, lint, typecheck (AC: all)
  - [x] 8.1 Run `pnpm test` — all 56 tests pass (12 shared + 16 API + 28 web)
  - [x] 8.2 Run `pnpm lint` — 0 errors
  - [x] 8.3 Run `pnpm typecheck` — clean (0 errors, 0 warnings)

### Review Findings

- [x] [Review][Patch] Auth middleware is registered on an empty plugin scope, so the real server currently protects no `/api/*` routes beyond leaving health public as intended. Register protected routes inside that scope or attach the hook to the actual route tree. [`apps/api/src/server.ts:14`]
- [x] [Review][Patch] The 401 retry path treats `refreshSession()` with `error: null` but no new session as success, which can leave stale auth state in memory and retry with the expired token instead of forcing the user back to login. [`apps/web/src/lib/api.ts:37`]
- [x] [Review][Patch] JWT verification cache entries are keyed by the raw bearer token even though the story requires a token-hash key, so the implementation stores secret JWTs directly in process memory. [`apps/api/src/middleware/auth.ts:10`]
- [x] [Review][Patch] Login failures render raw Supabase `error.message` text directly, so allowlist denials are not mapped to a clear product-specific message and may expose technical copy to end users. [`apps/web/src/App.svelte:26`]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Stack:** Svelte 5 + Vite SPA (`apps/web`) + Fastify BFF (`apps/api`). This is NOT Next.js/React. No SvelteKit either — plain Svelte + Vite.
- **Auth stays client-side:** Supabase SDK handles magic link flows, session persistence, token refresh, and `onAuthStateChange` in the browser. No server-side auth redirect handling.
- **SPA uses Supabase for auth ONLY.** All data operations go through `lib/api.ts` → Fastify BFF → per-request Supabase client. The browser Supabase client MUST NOT query data directly.
- **Same-domain deployment:** Vite proxy in dev (`/api/*` → `localhost:3001`), nginx reverse proxy in Docker. No CORS needed. Use relative `/api/*` paths in `api.ts`.
- **`user_id` from JWT ONLY:** The API MUST extract `user_id` exclusively from the verified JWT payload. NEVER trust request params/body for identity. Enforce this pattern in integration tests.
- **Per-request Supabase client:** Each API request creates a new Supabase client scoped to the user's JWT. This is how RLS enforcement works — the client's auth context determines data access.
- **60s JWT verification cache:** `supabase.auth.getUser()` round-trips to Supabase. Cache the result for 60s per token to reduce latency. Accepted trade-off: revoked sessions remain valid for up to 60s (documented, acceptable for 6-user MVP). Implement periodic cache cleanup (e.g., prune expired entries every 5 minutes) to prevent unbounded growth.
- **Error format:** All API errors use `{ error: { code: string, message: string } }`. Auth failure code: `UNAUTHORIZED`.
- **iOS Safari session risk:** Safari under storage pressure or long inactivity may evict Supabase session tokens. The SDK's `autoRefreshToken: true` and `persistSession: true` mitigate this, but verify session persistence on iOS Safari during testing. If evicted, user silently redirects to magic link flow (no error page).

### Supabase Client Initialization (Browser) — TIMING CRITICAL

**Problem:** `main.ts` statically imports `App.svelte` at the top of the file. If `App.svelte` → `auth-store.svelte.ts` → `supabase.ts` are chained imports, then `supabase.ts` module-level code executes BEFORE `loadConfig()` is awaited. `getConfig()` would return empty values.

**Solution:** Use lazy initialization — create the Supabase client on first access, not at module evaluation time:

```typescript
// apps/web/src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getConfig } from './config'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    const config = getConfig()
    client = createClient(config.SUPABASE_URL!, config.SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
```

Then in `auth-store.svelte.ts`, call `getSupabase()` inside `$effect` or methods — not at module top-level. This guarantees `loadConfig()` has completed (since `mount()` only runs after `await loadConfig()` in `main.ts`, and the store's `$effect` only runs after mount).

### Supabase API Patterns (Server)

```typescript
// apps/api/src/utils/supabase.ts — per-request client for RLS-scoped queries
import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient(jwt: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  )
}

// Admin client for getUser() verification (uses service role or anon key)
export function createSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

### Auth Middleware Pattern

```typescript
// apps/api/src/middleware/auth.ts
import type { FastifyRequest, FastifyReply } from 'fastify'

const verificationCache = new Map<string, { userId: string; expiresAt: number }>()

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } })
  }

  // Check cache (60s TTL)
  const cached = verificationCache.get(token)
  if (cached && cached.expiresAt > Date.now()) {
    request.userId = cached.userId
    request.supabaseClient = createSupabaseClient(token)
    return
  }

  // Verify with Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } })
  }

  // Cache and decorate
  verificationCache.set(token, { userId: user.id, expiresAt: Date.now() + 60_000 })
  request.userId = user.id
  request.supabaseClient = createSupabaseClient(token)
}
```

### authStore Pattern (Svelte 5 Runes)

```typescript
// apps/web/src/lib/stores/auth-store.svelte.ts
import { getSupabase } from '$lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

let user = $state<User | null>(null)
let session = $state<Session | null>(null)
let loading = $state(true)

$effect(() => {
  const supabase = getSupabase()
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session = newSession
    user = newSession?.user ?? null
    loading = false
  })
  return () => subscription.unsubscribe()
})

export const authStore = {
  get user() { return user },
  get session() { return session },
  get loading() { return loading },
  async signIn(email: string) {
    return getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
  },
  async signOut() {
    return getSupabase().auth.signOut()
  },
  async refreshSession() {
    return getSupabase().auth.refreshSession()
  },
}
```

### API Client Pattern (401 Retry)

```typescript
// apps/web/src/lib/api.ts
import { authStore } from '$lib/stores/auth-store.svelte'

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

async function request<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  const token = authStore.session?.access_token
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options?.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })

  if (res.status === 401) {
    const { error } = await authStore.refreshSession()
    if (error) {
      // Refresh failed — redirect to login
      await authStore.signOut()
      return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } }
    }
    // Retry once with new token
    const newToken = authStore.session?.access_token
    if (newToken) headers['Authorization'] = `Bearer ${newToken}`
    const retry = await fetch(path, { ...options, headers })
    if (!retry.ok) return { ok: false, error: await retry.json().then(r => r.error) }
    return { ok: true, data: await retry.json() }
  }

  if (!res.ok) return { ok: false, error: await res.json().then(r => r.error) }
  return { ok: true, data: await res.json() }
}
```

### Login UI Requirements (UX Spec)

- **Form fields:** Single email input with visible label (not placeholder-only)
- **Input size:** 16px / 1rem (prevents iOS Safari zoom on focus)
- **Focus style:** 2px `accent-hot` outline, 2px offset, `:focus-visible` only (no pointer focus ring)
- **Error display:** `state-error` border + inline error text below field. No tooltips, no toasts, no summary above form.
- **Primary button:** `bg-accent-hot text-white font-loud rounded-lg px-6 py-3`, full-width on mobile
- **Session expiry:** Redirect to magic link flow silently — no error page, no "something went wrong"
- **Auth error text:** Never show raw HTTP codes, "something went wrong", or "try again later"
- **Mobile:** touch targets ≥48px; stacked layout
- **Breakpoints:** 0–767px mobile, ≥768px desktop (`md:` Tailwind prefix)

### Environment Variables

Already documented in `.env.example` and `apps/api/.env.example`:
- `SUPABASE_URL` — local: `http://127.0.0.1:54321`
- `SUPABASE_ANON_KEY` — from `supabase start` output
- `SUPABASE_SERVICE_ROLE_KEY` — from `supabase start` output (API only, never in web)

Web app gets `SUPABASE_URL` and `SUPABASE_ANON_KEY` via `/config.json` (runtime config loaded by `loadConfig()` in `main.ts`). In dev, `apps/web/public/config.json` has placeholder values — set real local Supabase values there.

### Local Development Auth Testing

- `supabase start` runs local Supabase with Inbucket email service
- Magic link emails appear at `http://localhost:54324` (Inbucket web UI)
- `config.toml` already configures: `site_url = "http://localhost:5173"`, `additional_redirect_urls = ["http://localhost:5173"]`
- `enable_confirmations = false` locally — magic links work immediately
- Email allowlist is NOT enforced locally (production-only via Supabase Dashboard)

### Existing Code to Build On

| File | Current State | Action |
|------|--------------|--------|
| `apps/web/src/lib/supabase.ts` | Stub comment | Replace with Supabase client |
| `apps/web/src/lib/config.ts` | Working — loads `/config.json` | No changes needed |
| `apps/web/src/lib/api.ts` | Stub comment | Replace with typed API client |
| `apps/web/src/App.svelte` | Placeholder "App shell ready" | Convert to auth gate |
| `apps/web/src/main.ts` | Working — `loadConfig()` → `mount()` | No changes needed |
| `apps/api/src/server.ts` | Fastify + health route only | Add auth middleware registration |
| `apps/api/src/routes/health.ts` | Working health endpoint | No changes (remains public) |

### File Structure (New Files)

```
apps/web/src/lib/
├── supabase.ts                          # Replace stub
├── supabase.test.ts                     # NEW
├── api.ts                               # Replace stub
├── api.test.ts                          # NEW
├── stores/
│   ├── auth-store.svelte.ts             # NEW
│   └── auth-store.test.ts              # NEW
apps/api/src/
├── middleware/
│   ├── auth.ts                          # NEW
│   └── auth.test.ts                    # NEW
├── utils/
│   ├── supabase.ts                      # NEW
│   └── supabase.test.ts               # NEW
├── server.ts                            # MODIFY
```

### Testing Strategy

- **Unit tests (Vitest):** Mock `@supabase/supabase-js` for store, API client, and middleware tests
- **Co-located:** Test files next to source (`auth.test.ts` beside `auth.ts`)
- **Auth middleware tests:** Verify token extraction, cache hit/miss, 401 responses, `userId` decoration
- **authStore tests:** Verify `onAuthStateChange` subscription, signIn/signOut calls, state transitions
- **API client tests:** Verify Bearer header injection, 401 retry logic, redirect on refresh failure
- **E2E (Playwright):** `e2e/tests/auth.spec.ts` exists as target path — implement magic link login flow using Inbucket API to retrieve magic link URL
- **tsconfig exclusion:** Test files (`**/*.test.ts`) excluded from production build; included by Vitest config

### Anti-Patterns (DO NOT)

- **DO NOT** use SvelteKit or any server-side rendering — this is a plain Svelte 5 + Vite SPA
- **DO NOT** query Supabase for data from the browser client — data goes through `api.ts` → Fastify BFF
- **DO NOT** store `SUPABASE_SERVICE_ROLE_KEY` or any secrets in `apps/web` or client code
- **DO NOT** use `supabase.auth.getSession()` for server-side verification — use `getUser()` which validates the JWT with Supabase
- **DO NOT** trust `user_id` from request body/params — always extract from verified JWT
- **DO NOT** use `@fastify/cors` — same-domain deployment eliminates CORS
- **DO NOT** add a router — single-view SPA; `App.svelte` is the auth gate
- **DO NOT** use bare `auth.uid()` in RLS policies (Story 1.2 already uses `(select auth.uid())` — just be aware)
- **DO NOT** use toasts for auth feedback — use inline messages per UX spec
- **DO NOT** create `groups` or `extraction_feedback` tables/routes — those are later stories

### Previous Story Intelligence (from Story 1.2)

- Migration uses `(select auth.uid()) = user_id` in RLS policies (optimizer-friendly form)
- `config.toml` has `site_url` and `additional_redirect_urls` pointing to `http://localhost:5173` — magic link redirects will land at the Vite dev server
- Supabase CLI `v2.92.1` at root; `@supabase/supabase-js v2.103.3` in API
- DB naming: snake_case everywhere; camelCase ↔ snake_case transform happens in API layer (Story 2.1's `transform.ts`)
- Email allowlist is dashboard-only (not in code/migrations) — production config
- 17 existing tests pass; lint and typecheck clean
- Review found: NULL columns needing NOT NULL → fixed; CI drift check stderr handling → fixed

### Fastify Request Type Augmentation

Extend Fastify request type for TypeScript to include `userId` and `supabaseClient`:

```typescript
// apps/api/src/types.d.ts or in auth.ts
import type { SupabaseClient } from '@supabase/supabase-js'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
    supabaseClient: SupabaseClient
  }
}
```

### Project Structure Notes

- Monorepo root: Turborepo + pnpm workspaces (`apps/*`, `packages/*`, `e2e`)
- Package names: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- Store file naming: kebab-case + `.svelte.ts` extension (e.g., `auth-store.svelte.ts`)
- Shared package (`packages/shared`) exports Zod schemas including `ErrorCode` — reuse for `UNAUTHORIZED`

### References

- [Source: architecture.md#Authentication & Security] — auth approach, JWT verification, 60s cache, per-request client
- [Source: architecture.md#Frontend Architecture] — authStore, onAuthStateChange, typed API client
- [Source: architecture.md#System Boundaries] — SPA ↔ Supabase (auth only), SPA ↔ BFF (data)
- [Source: epics.md#Story 1.3] — acceptance criteria, BDD scenarios
- [Source: prd.md#Security] — FR1-FR4, NFR10-NFR16, iOS Safari session risk
- [Source: ux-design-specification.md#Form Patterns] — input styling, error display, focus rings
- [Source: ux-design-specification.md#Degradation] — session expiry redirect, no error pages
- [Source: 1-2-database-schema-and-auth-configuration.md] — RLS policies, config.toml setup, env vars
- [Source: @supabase/supabase-js v2.103.3 docs] — signInWithOtp, onAuthStateChange, getUser, createClient options

## Dev Agent Record

### Agent Model Used

Opus 4.6

### Debug Log References

- Svelte 5 `$state` creates proxy objects — `toBe` (Object.is) fails for state comparisons; switched to `toEqual` for deep equality in auth-store tests
- ESLint did not parse `.svelte.ts` files — added explicit TypeScript parser config for `**/*.svelte.ts` in `eslint.config.js`
- `zod` not resolvable in web tests — added `zod` as direct dependency of `@smart-todo/web` since `api.ts` uses it for response validation
- authStore uses imperative `init()` instead of top-level `$effect` — `$effect` at module level in `.svelte.ts` requires component context; `init()` called from `App.svelte` ensures proper timing

### Completion Notes List

- Implemented lazy-initialized Supabase browser client (`getSupabase()`) avoiding static import timing issue with `loadConfig()`
- Created `authStore` with Svelte 5 `$state` runes — manages user/session/loading state, subscribes to `onAuthStateChange`, exposes signIn/signOut/refreshSession
- Built typed API client with `ApiResult<T>` discriminated union, 401 retry with token refresh, automatic signOut on refresh failure, optional Zod schema validation
- Converted `App.svelte` to auth gate: loading → login form → authenticated view. UX-compliant form (visible label, 16px input, focus-visible ring, inline errors, coral primary button)
- Implemented Fastify auth middleware with JWT verification via `getUser()`, 60s in-memory cache with periodic cleanup, per-request Supabase client factory for RLS-scoped queries
- Added Fastify request type augmentation (`types.d.ts`) for `userId` and `supabaseClient`
- Registered auth middleware in protected scope in `server.ts` — health route remains public
- Fixed ESLint config to support `.svelte.ts` files with TypeScript parser
- All 50 tests pass, 0 lint errors, 0 type errors

### Change Log

- 2026-04-20: Story 1.3 implemented — auth client, authStore, typed API client, login UI, Fastify auth middleware, per-request Supabase client

### File List

- `apps/web/package.json` — MODIFIED (added @supabase/supabase-js, zod)
- `apps/web/src/lib/supabase.ts` — MODIFIED (replaced stub with lazy-init getSupabase())
- `apps/web/src/lib/supabase.test.ts` — NEW (3 tests)
- `apps/web/src/lib/stores/auth-store.svelte.ts` — NEW (authStore with Svelte 5 runes)
- `apps/web/src/lib/stores/auth-store.test.ts` — NEW (8 tests)
- `apps/web/src/lib/api.ts` — MODIFIED (replaced stub with typed API client)
- `apps/web/src/lib/api.test.ts` — NEW (9 tests)
- `apps/web/src/App.svelte` — MODIFIED (auth gate with login form)
- `apps/web/eslint.config.js` — MODIFIED (added .svelte.ts TypeScript parser support)
- `apps/api/src/utils/supabase.ts` — NEW (admin client + per-request client factory)
- `apps/api/src/utils/supabase.test.ts` — NEW (5 tests)
- `apps/api/src/middleware/auth.ts` — NEW (JWT verification, 60s cache, request decoration)
- `apps/api/src/middleware/auth.test.ts` — NEW (8 tests)
- `apps/api/src/types.d.ts` — NEW (Fastify request type augmentation)
- `apps/api/src/server.ts` — MODIFIED (registered auth middleware in protected scope)
- `pnpm-lock.yaml` — MODIFIED (dependency changes)
