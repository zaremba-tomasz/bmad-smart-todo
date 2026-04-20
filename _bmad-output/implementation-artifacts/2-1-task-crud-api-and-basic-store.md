# Story 2.1: Task CRUD API & Basic Store

Status: done

## Story

As a user,
I want my tasks to be saved and retrievable through a reliable API,
so that my captured tasks are persisted and available across devices.

## Acceptance Criteria

1. **Create task:** Given I am authenticated, when I `POST /api/tasks` with a title and optional fields (dueDate, dueTime, location, priority), then the API validates the request body against the shared `CreateTaskRequestSchema`, inserts into the `tasks` table with my `user_id` from the verified JWT, and returns the created task in camelCase JSON with HTTP 201.

2. **List tasks:** Given I am authenticated, when I `GET /api/tasks`, then the API returns all my non-deleted tasks (`deleted_at IS NULL`), both open and completed, sorted by priority weight (urgent > high > medium > low > null) with `due_date` as tiebreaker.

3. **Complete task:** Given I am authenticated, when I `POST /api/tasks/:id/complete`, then `is_completed` is set to `true` and `completed_at` is set to the current timestamp.

4. **Uncomplete task:** Given I am authenticated, when I `POST /api/tasks/:id/uncomplete`, then `is_completed` is set to `false` and `completed_at` is set to `null`.

5. **RLS enforcement:** Given any task request, the per-request Supabase client is created with my JWT and RLS enforces user isolation. Integration tests verify that User A cannot access User B's tasks.

6. **Snake/camel transform:** The `snake_case` ↔ `camelCase` transform runs via a utility in `apps/api/src/utils/transform.ts`.

7. **Task store:** Given the SPA initializes, the `taskStore` fetches tasks via the typed API client (`lib/api.ts`) using `GET /api/tasks`, stores them as reactive state, reads JWT from `authStore` at call time, and validates responses against shared Zod schemas.

## Tasks / Subtasks

- [x] Task 1: Create snake_case ↔ camelCase transform utility (AC: #6)
  - [x] 1.1 Create `apps/api/src/utils/transform.ts` with `snakeToCamel()` and `camelToSnake()` functions
  - [x] 1.2 Handle nested objects and arrays
  - [x] 1.3 Create `apps/api/src/utils/transform.test.ts` with edge cases (null, empty, nested)

- [x] Task 2: Create task routes in Fastify (AC: #1, #2, #3, #4, #5, #6)
  - [x] 2.1 Create `apps/api/src/routes/tasks.ts` as a Fastify plugin
  - [x] 2.2 `POST /api/tasks` — validate with `CreateTaskRequestSchema`, transform to snake_case, insert via `request.supabaseClient`, return 201 with camelCase task
  - [x] 2.3 `GET /api/tasks` — query `tasks` where `deleted_at IS NULL` for `request.userId`, order by priority weight then `due_date`, transform to camelCase
  - [x] 2.4 `POST /api/tasks/:id/complete` — update `is_completed = true`, `completed_at = now()`, verify ownership via RLS
  - [x] 2.5 `POST /api/tasks/:id/uncomplete` — update `is_completed = false`, `completed_at = null`, verify ownership via RLS
  - [x] 2.6 Return `{ data: ... }` on success (matching `ApiSuccessSchema`) and `{ error: { code, message } }` on failure (matching `ApiErrorSchema`)

- [x] Task 3: Register task routes in server.ts (AC: #1-#5)
  - [x] 3.1 Import and register `taskRoutes` in `buildServer()`

- [x] Task 4: Write API integration tests (AC: #1-#6)
  - [x] 4.1 Create `apps/api/src/routes/tasks.test.ts`
  - [x] 4.2 Test: create task with valid body returns 201 + camelCase response
  - [x] 4.3 Test: create task with missing title returns 400 + VALIDATION_ERROR
  - [x] 4.4 Test: list tasks returns only non-deleted tasks sorted by priority then due_date
  - [x] 4.5 Test: complete sets is_completed + completed_at
  - [x] 4.6 Test: uncomplete clears is_completed + completed_at
  - [x] 4.7 Test: unauthenticated request returns 401
  - [x] 4.8 Test: user A cannot access user B's tasks (RLS isolation)

- [x] Task 5: Create taskStore with Svelte 5 runes (AC: #7)
  - [x] 5.1 Create `apps/web/src/lib/stores/task-store.svelte.ts`
  - [x] 5.2 Expose reactive `tasks` state via `$state` (typed `Task[]`)
  - [x] 5.3 Implement `loadTasks()` — calls `api.get('/api/tasks', ApiSuccessSchema(z.array(TaskSchema)))` and updates state
  - [x] 5.4 Implement `createTask(input: CreateTaskRequest)` — calls `api.post('/api/tasks', input, ...)` and prepends to state
  - [x] 5.5 Implement `completeTask(id: string)` / `uncompleteTask(id: string)` — calls respective API endpoints and updates local state
  - [x] 5.6 Expose `$derived` computed: `openTasks`, `completedTasks`, `completedCount`

- [x] Task 6: Write taskStore unit tests (AC: #7)
  - [x] 6.1 Create `apps/web/src/lib/stores/task-store.test.ts`
  - [x] 6.2 Test: loadTasks populates tasks from API response
  - [x] 6.3 Test: createTask adds task to local state
  - [x] 6.4 Test: completeTask updates task state locally
  - [x] 6.5 Test: uncompleteTask updates task state locally
  - [x] 6.6 Test: API error does not corrupt local state
  - [x] 6.7 Mock `api` module — do not make real HTTP calls

- [x] Task 7: Verify lint, typecheck, all tests pass
  - [x] 7.1 `pnpm lint` — 0 errors
  - [x] 7.2 `pnpm typecheck` — 0 errors
  - [x] 7.3 `pnpm test` — all tests pass (shared + api + web)

### Review Findings

- [x] [Review][Patch] Validate API responses with shared schemas before returning data [apps/api/src/routes/tasks.ts:48]
- [x] [Review][Patch] Use shared `ErrorCode` enum constants for task route error responses [apps/api/src/routes/tasks.ts:31]
- [x] [Review][Patch] Validate `/api/tasks/:id/*` params as UUID and return `VALIDATION_ERROR` on invalid IDs [apps/api/src/routes/tasks.ts:73]
- [x] [Review][Patch] Prevent completion state updates for soft-deleted tasks (`deleted_at IS NULL`) [apps/api/src/routes/tasks.ts:76]
- [x] [Review][Patch] Add `try/catch/finally` hardening in `taskStore` async methods to avoid stuck loading/unhandled rejection [apps/web/src/lib/stores/task-store.svelte.ts:22]
- [x] [Review][Patch] Add tests for complete/uncomplete error paths (`NOT_FOUND`, invalid id, backend error mapping) [apps/api/src/routes/tasks.test.ts:186]
- [x] [Review][Patch] Strengthen RLS isolation tests with cross-user mutation attempts, not list-only checks [apps/api/src/routes/tasks.test.ts:246]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Monorepo:** Turborepo + pnpm workspaces. Packages: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- **API stack:** Fastify 5 + Supabase JS SDK (PostgREST) + Zod. NOT Express, NOT Drizzle, NOT raw SQL queries from app code
- **Frontend stack:** Svelte 5 + Vite SPA. NOT SvelteKit. NOT React
- **Svelte 5 Runes:** Use `$state()`, `$derived()`, `$effect()`. No `export let`. No Svelte 4 stores (`writable`, `readable`)
- **Store files:** kebab-case `.svelte.ts` extension (e.g., `task-store.svelte.ts`)
- **Component files:** PascalCase `.svelte` extension
- **Co-located tests:** Test files next to source (e.g., `task-store.test.ts` beside `task-store.svelte.ts`)
- **No client-side router** — single-view SPA; `App.svelte` is the auth gate
- **Same-domain deployment:** SPA calls `/api/*` relative paths. Vite proxies to `localhost:3001` in dev

### Database Schema (Already Exists — DO NOT Modify)

The `tasks` table and RLS policies already exist in `supabase/migrations/20260420000000_initial_schema.sql`:

```sql
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  due_date date,
  due_time time,
  location text,
  priority task_priority,
  group_id uuid,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: authenticated users can only access their own rows
-- Anon access is denied
```

**DO NOT** create new migrations. The schema is ready.

### Shared Zod Schemas (Already Exist — Reuse)

`packages/shared/src/schemas/task.ts`:
- `TaskSchema` — full task shape in camelCase
- `CreateTaskRequestSchema` — creation payload (title required, optional dueDate/dueTime/location/priority, groupId fixed to null for now)

`packages/shared/src/schemas/api.ts`:
- `ApiSuccessSchema(dataSchema)` — wraps response: `{ data: T }`
- `ApiErrorSchema` — wraps error: `{ error: { code, message } }`
- `ErrorCode` — enum of all error codes (VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, SERVER_ERROR, etc.)

**DO NOT** duplicate these. Import from `@smart-todo/shared`.

### snake_case ↔ camelCase Transform (NEW — Create This)

The database uses `snake_case` columns. The API JSON contract uses `camelCase`. A transform utility is needed at the API boundary.

Create `apps/api/src/utils/transform.ts`:

```typescript
export function snakeToCamel<T>(obj: Record<string, unknown>): T
export function camelToSnake(obj: Record<string, unknown>): Record<string, unknown>
```

**Transform pipeline:**
- **Request path:** Receive camelCase JSON → Zod parse (camelCase) → `camelToSnake()` → database write
- **Response path:** Database row (snake_case) → `snakeToCamel()` → Zod parse (camelCase) → send JSON

**Edge cases:** Handle `null` values, `undefined` fields, nested objects (not needed now but safe to support), arrays of objects, and preserve non-object values unchanged.

### Task Routes Implementation Guide

Create `apps/api/src/routes/tasks.ts` as a Fastify plugin:

```typescript
import type { FastifyInstance } from 'fastify'
import { CreateTaskRequestSchema, TaskSchema, ApiSuccessSchema } from '@smart-todo/shared'
import { snakeToCamel, camelToSnake } from '../utils/transform.js'

export async function taskRoutes(fastify: FastifyInstance) {
  // POST /api/tasks
  fastify.post('/api/tasks', async (request, reply) => {
    // 1. Validate request.body against CreateTaskRequestSchema
    // 2. camelToSnake the validated body
    // 3. Add user_id from request.userId
    // 4. Insert via request.supabaseClient.from('tasks').insert(...).select().single()
    // 5. snakeToCamel the returned row
    // 6. Return reply.status(201).send({ data: task })
  })

  // GET /api/tasks
  fastify.get('/api/tasks', async (request, reply) => {
    // 1. Query request.supabaseClient.from('tasks')
    //    .select('*')
    //    .is('deleted_at', null)
    //    .order(...) — see priority sort below
    // 2. snakeToCamel each row
    // 3. Return { data: tasks }
  })

  // POST /api/tasks/:id/complete
  // POST /api/tasks/:id/uncomplete
}
```

Register in `server.ts`:
```typescript
import { taskRoutes } from './routes/tasks.js'
// ...
fastify.register(taskRoutes)
```

### Priority Sort Implementation

Tasks are sorted by priority weight (urgent > high > medium > low > null) with `due_date` as tiebreaker. Supabase PostgREST does not support custom sort expressions directly.

**Approach:** Query all tasks and sort in application code:

```typescript
const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 4, high: 3, medium: 2, low: 1,
}

function sortTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    const wa = a.priority ? PRIORITY_WEIGHT[a.priority] ?? 0 : 0
    const wb = b.priority ? PRIORITY_WEIGHT[b.priority] ?? 0 : 0
    if (wb !== wa) return wb - wa
    // due_date tiebreaker: tasks with dates before tasks without, then chronological
    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    return 0
  })
}
```

This is acceptable at MVP scale (6 users). The sort runs server-side in the API route before returning to the client.

### Auth Middleware (Already Exists — Leveraged Automatically)

The global `preHandler` in `server.ts` runs `authMiddleware` for all `/api/*` routes (except `/api/health`). After middleware runs, `request.userId` (string UUID) and `request.supabaseClient` (per-request Supabase client scoped to user JWT) are available.

**DO NOT** re-implement auth checks in task routes. The middleware handles it.

**User ID source:** ONLY from `request.userId` (JWT-verified). NEVER from request params or body.

### Supabase Client Usage Pattern

Use `request.supabaseClient` (created per-request with user JWT) for all data queries. RLS policies enforce row-level security automatically.

```typescript
// Insert
const { data, error } = await request.supabaseClient
  .from('tasks')
  .insert({ user_id: request.userId, title, due_date, ... })
  .select()
  .single()

// Select
const { data, error } = await request.supabaseClient
  .from('tasks')
  .select('*')
  .is('deleted_at', null)

// Update
const { data, error } = await request.supabaseClient
  .from('tasks')
  .update({ is_completed: true, completed_at: new Date().toISOString() })
  .eq('id', taskId)
  .select()
  .single()
```

**Important:** Always chain `.select()` after `.insert()` and `.update()` to get the returned row. Always chain `.single()` when expecting one row.

### Error Response Format

All errors MUST follow the `ApiErrorSchema` format:

```typescript
reply.status(400).send({
  error: { code: 'VALIDATION_ERROR', message: 'Title is required' }
})

reply.status(404).send({
  error: { code: 'NOT_FOUND', message: 'Task not found' }
})
```

Use `ErrorCode` enum values from `@smart-todo/shared`. The `message` field is for developer debugging only — never shown to users.

### API Client (Already Exists — Reuse)

`apps/web/src/lib/api.ts` provides `api.get()`, `api.post()`, `api.put()`, `api.delete()` which:
- Attach `Authorization: Bearer <jwt>` from `authStore.session`
- Retry once on 401 with token refresh
- Optionally validate response against Zod schema
- Return `ApiResult<T>` discriminated union

**Use from taskStore:**
```typescript
import { api, type ApiResult } from '$lib/api'
import { TaskSchema, ApiSuccessSchema } from '@smart-todo/shared'
import { z } from 'zod'

const TaskListResponseSchema = ApiSuccessSchema(z.array(TaskSchema))

const result = await api.get('/api/tasks', TaskListResponseSchema)
if (result.ok) {
  tasks = result.data.data // { data: Task[] }
}
```

### taskStore Pattern (Follow authStore Convention)

Model after `auth-store.svelte.ts` — module-level `$state` variables with an exported object exposing getters and methods:

```typescript
// task-store.svelte.ts
import type { Task, CreateTaskRequest } from '@smart-todo/shared'

let tasks = $state<Task[]>([])
let loading = $state(false)

export const taskStore = {
  get tasks() { return tasks },
  get loading() { return loading },
  get openTasks() { /* $derived would be ideal but getters on plain objects 
     can use filtering directly */ return tasks.filter(t => !t.isCompleted) },
  get completedTasks() { return tasks.filter(t => t.isCompleted) },
  get completedCount() { return tasks.filter(t => t.isCompleted).length },

  async loadTasks() { /* ... */ },
  async createTask(input: CreateTaskRequest) { /* ... */ },
  async completeTask(id: string) { /* ... */ },
  async uncompleteTask(id: string) { /* ... */ },
}
```

**Note:** `$derived` cannot be used inside a plain object literal. Use getter functions that compute from `$state` variables. The reactivity works because `$state` is tracked through the getter access in Svelte 5 components.

**Note:** This story creates a **basic** store (direct API calls, update local state on success). The optimistic UI pattern with localStorage persistence, retry logic, and sync status tracking comes in **Story 2.2**. DO NOT implement optimistic UI or localStorage in this story.

### Testing Patterns

**API tests (`apps/api`):**
- Use Fastify's `inject()` method for HTTP-level testing without starting a server
- Mock `request.supabaseClient` — the Supabase client is created by auth middleware, so mock the middleware or the Supabase utils
- Test the transform utility with pure unit tests
- Use the existing test pattern from `health.test.ts` and `auth.test.ts`

**Store tests (`apps/web`):**
- Mock the `$lib/api` module to return controlled `ApiResult` values
- Use `vi.mock('$lib/api', ...)` in Vitest
- Assert with `toEqual` not `toBe` (Svelte 5 `$state` proxy — see tooling reference)
- Test environment is `happy-dom` (configured in `vitest.config.ts`)
- Resolve conditions: `['browser']` already configured for Svelte 5

**RLS isolation test:**
- Create two mock users with different JWTs
- Insert a task as User A
- Attempt to read/update/delete as User B
- Verify Supabase returns empty result or error (RLS blocks access)

### File Structure (New/Modified Files)

```
apps/api/src/
├── routes/
│   ├── tasks.ts              # NEW — task CRUD endpoints
│   └── tasks.test.ts         # NEW — integration tests
├── utils/
│   ├── transform.ts          # NEW — snake/camel transform
│   └── transform.test.ts     # NEW — transform unit tests
├── server.ts                 # MODIFY — register taskRoutes

apps/web/src/lib/
├── stores/
│   ├── task-store.svelte.ts  # NEW — reactive task state + API calls
│   └── task-store.test.ts    # NEW — store unit tests
```

### Anti-Patterns (DO NOT)

- **DO NOT** create new database migrations — the tasks table already exists
- **DO NOT** duplicate Zod schemas — import from `@smart-todo/shared`
- **DO NOT** implement optimistic UI, localStorage persistence, or retry logic — that is Story 2.2
- **DO NOT** implement any UI components (TaskList, TaskItem, EmptyState) — those are Stories 2.3+
- **DO NOT** add `@fastify/rate-limit` to task routes — rate limiting is for `/api/extract` only (Story 2.5)
- **DO NOT** use `export let` in Svelte files — use `$props()` rune
- **DO NOT** use Svelte 4 stores (`writable`, `readable`) — use Svelte 5 runes
- **DO NOT** add `user_id` to request body or URL params — always use `request.userId` from JWT
- **DO NOT** add recurrence fields to the task model — deferred beyond MVP
- **DO NOT** use `.env` files in tests — mock Supabase client directly
- **DO NOT** use `$effect` in the taskStore — use explicit function calls (see tooling reference)
- **DO NOT** wire the taskStore into AppLayout or any UI — the store is created and tested in isolation this story

### Null Handling Convention

API responses use explicit `null`, never omit fields. Every field in `TaskSchema` is present in every response. `null` means "not set." This matches the nullable (not optional) Zod schema design.

### Date/Time Format Convention

| Type | JSON Format | Example |
|------|-------------|---------|
| Date | `YYYY-MM-DD` | `"2026-04-15"` |
| Time | `HH:mm` | `"14:30"` |
| Timestamp | ISO 8601 | `"2026-04-15T14:30:00Z"` |

All IDs are `uuid`, generated by the database (`gen_random_uuid()`), never by application code.

### Previous Story Intelligence

**From Epic 1 retrospective (2026-04-20):**
- 68 tests at completion (14 shared + 16 API + 38 web)
- Build/packaging was the blind spot — application logic was generally correct first pass
- Accessibility needs upfront attention — consistently under-delivered initially
- Front-loaded tooling pain is resolved — Svelte 5 + Vite gotchas all fixed
- Review findings target: ~3/story (down from ~6/story in Epic 1)

**From Story 1.4 (last implemented):**
- `vitest.config.ts` has `resolve.conditions: ['browser']` — required for Svelte 5 component rendering in tests
- Use `toEqual` not `toBe` for state comparisons (Svelte 5 proxy objects)
- `AppLayout.svelte` has placeholder capture and task list areas ready for future stories
- ESLint parses `.svelte.ts` files correctly (fixed in Epic 1)
- `$lib` alias resolves to `apps/web/src/lib` via Vite config

**Technical debt carried into Epic 2:**
- shadcn-svelte not yet CLI-initialized (needed for Story 2.6/2.7, not this story)
- No E2E tests yet (Playwright placeholder only) — target first test in Story 2.3/2.4
- `scripts/dev-full.sh` bootstrap script created per retrospective action item

### Git Intelligence

Recent commits follow `feat:` prefix pattern for story implementations. Stories are implemented then reviewed before marking done. Commit lineage:

```
ce4207d chore: retrospective after epic 1 + action items addressed
07eab31 feat: story 1.4 implemented and reviewed
4cfa9d7 feat: story 1.3 implemented and reviewed
7db0b2c feat: story 1.2 implemented and reviewed
4bf3fe6 feat: story 1.1 implemented and reviewed
```

### Project Structure Notes

- Monorepo structure established and stable from Epic 1
- Import order: external packages → monorepo packages (`@smart-todo/shared`) → local relative imports
- `packages/shared` must be built (`pnpm build` in shared) before API/web can import — Turbo handles this via `build` dependency in `turbo.json`
- API uses `.js` extension in imports for ESM compatibility (e.g., `'./routes/tasks.js'`)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — acceptance criteria, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#API Endpoints] — REST endpoint patterns, data contracts
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — tasks table schema, RLS policies
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Conventions] — snake/camel transform rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Schema Ownership Rules] — shared vs local schemas
- [Source: _bmad-output/planning-artifacts/architecture.md#Svelte Store Architecture] — taskStore specification
- [Source: _bmad-output/planning-artifacts/architecture.md#Security Hardening] — JWT verification, user_id from JWT only
- [Source: _bmad-output/planning-artifacts/prd.md#FR25] — list open tasks, FR29-31 complete/uncomplete, FR4 user isolation
- [Source: packages/shared/src/schemas/task.ts] — existing TaskSchema, CreateTaskRequestSchema
- [Source: packages/shared/src/schemas/api.ts] — ApiSuccessSchema, ApiErrorSchema, ErrorCode
- [Source: apps/api/src/server.ts] — existing server structure, auth middleware hook
- [Source: apps/api/src/middleware/auth.ts] — JWT verification, request.userId, request.supabaseClient
- [Source: apps/web/src/lib/api.ts] — typed API client with ApiResult<T>
- [Source: apps/web/src/lib/stores/auth-store.svelte.ts] — Svelte 5 store pattern to follow
- [Source: docs/svelte5-tooling-reference.md] — resolved tooling issues, patterns
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-04-20.md] — retrospective learnings
- [Source: _bmad-output/implementation-artifacts/1-4-authenticated-app-shell-with-responsive-layout.md] — previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed ESLint import-x/order: moved Fastify type import after @smart-todo/shared imports
- Fixed Supabase client mock chain in tasks.test.ts: `.is()` must return a thenable directly, not a function

### Completion Notes List

- Created snake_case ↔ camelCase transform utility with recursive nested object/array support (18 unit tests)
- Implemented all 4 task CRUD endpoints as a Fastify plugin: POST /api/tasks (create), GET /api/tasks (list sorted by priority+dueDate), POST /api/tasks/:id/complete, POST /api/tasks/:id/uncomplete
- Priority sort runs server-side in application code using weighted sort (urgent=4, high=3, medium=2, low=1, null=0) with dueDate tiebreaker
- All endpoints use request.supabaseClient (per-request, JWT-scoped) and request.userId from auth middleware
- Error responses follow ApiErrorSchema format with ErrorCode values
- Registered taskRoutes in server.ts buildServer()
- Created taskStore using Svelte 5 $state runes following authStore pattern — loadTasks, createTask, completeTask, uncompleteTask with computed getters for openTasks, completedTasks, completedCount
- No optimistic UI, no localStorage, no $effect — basic store per story scope
- 7 API integration tests + 13 store unit tests + 18 transform unit tests = 38 new tests
- All 107 tests pass (12 shared + 41 API + 54 web), lint 0 errors, typecheck 0 errors

### Change Log

- 2026-04-20: Implemented Story 2.1 — Task CRUD API & Basic Store (all 7 tasks completed)

### File List

- apps/api/src/utils/transform.ts (NEW)
- apps/api/src/utils/transform.test.ts (NEW)
- apps/api/src/routes/tasks.ts (NEW)
- apps/api/src/routes/tasks.test.ts (NEW)
- apps/api/src/server.ts (MODIFIED — registered taskRoutes)
- apps/web/src/lib/stores/task-store.svelte.ts (NEW)
- apps/web/src/lib/stores/task-store.test.ts (NEW)
