# Story 2.2: Optimistic Data Layer & Sync Resilience

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want my actions to feel instant even on slow connections,
So that the app never makes me wait for a server round-trip.

## Acceptance Criteria

1. **Optimistic create:** Given I create a task through the SPA, when the taskStore processes the mutation, then the task appears in my local state immediately before the API confirms, the pending mutation is persisted to localStorage, and a sync status of `'pending'` is tracked for the task.

2. **Sync confirmation:** Given a task was created optimistically, when the API confirms the save, then the sync status changes to `'synced'` and the pending mutation is removed from localStorage.

3. **Retry with backoff:** Given a task mutation fails (create, complete, uncomplete), when the API returns an error, then the taskStore retries 3 times with exponential backoff (5s, 15s, 30s). The task's sync status remains `'pending'` with a subtle sync dot visible on the task item (`SyncIndicator` component). Tapping the sync dot triggers an immediate retry.

4. **Replay on reload:** Given the app is reloaded after a browser close, when the taskStore initializes, then any pending mutations in localStorage are replayed before fetching fresh state from the API.

5. **Auto-retry on reconnect:** Given the browser comes back online (`navigator.onLine` + `online` event), when there are pending mutations, then all pending mutations are automatically retried.

6. **Global unsynced banner:** Given any task has been unsynced for more than 60 seconds, when I view the app, then a global muted banner appears: "Some tasks haven't synced yet". The banner is dismissible manually and auto-clears when all tasks sync.

7. **Rollback on rejection:** Given the API rejects a task on retry (validation error, not a transient failure), when the server returns a non-retryable error, then the optimistic local task is rolled back (removed from local state and localStorage).

8. **Extensible pattern:** Given this optimistic data layer exists, when future stories add mutations (completion, editing, deletion, group assignment), they use the same optimistic pattern: local write → localStorage persist → background API → retry → rollback on rejection.

## Tasks / Subtasks

- [x] Task 1: Define SPA-internal types for sync/mutation tracking (AC: #1, #2, #8)
  - [x] 1.1 Add `SyncStatus` type (`'synced' | 'pending'`) to `apps/web/src/lib/types/index.ts`
  - [x] 1.2 Add `MutationType` enum (`'create' | 'complete' | 'uncomplete'`) to `types/index.ts`
  - [x] 1.3 Add `PendingMutation` interface: `{ id: string, type: MutationType, payload: unknown, createdAt: number, retryCount: number }`
  - [x] 1.4 Add `TaskWithSync` type that extends `Task` with `syncStatus: SyncStatus` and `tempId?: string`

- [x] Task 2: Refactor taskStore for optimistic mutations and sync tracking (AC: #1, #2, #3, #7, #8)
  - [x] 2.1 Add `syncStatus: Map<string, SyncStatus>` to module-level state
  - [x] 2.2 Add `pendingMutations: PendingMutation[]` to module-level state
  - [x] 2.3 Refactor `createTask()`: generate a temporary UUID (`crypto.randomUUID()`), insert task into local `tasks` immediately with `tempId`, set sync status to `'pending'`, persist mutation to `pendingMutations`, fire background API call
  - [x] 2.4 On API success: replace temp task with server response (swap `tempId` → real `id`), update `syncStatus` to `'synced'`, remove from `pendingMutations`
  - [x] 2.5 On API failure: classify error — if retryable (`SERVER_ERROR`, `RATE_LIMITED`, network error), increment `retryCount` and schedule retry; if non-retryable (`VALIDATION_ERROR`, `NOT_FOUND`), rollback (remove task from local state and `pendingMutations`)
  - [x] 2.6 Refactor `completeTask()` and `uncompleteTask()`: apply state change locally first (set `isCompleted`/`completedAt`), track as pending mutation, fire background API call with same retry/rollback logic
  - [x] 2.7 Expose new getters: `getSyncStatus(taskId: string): SyncStatus`, `hasPendingMutations: boolean`, `pendingCount: number`
  - [x] 2.8 Expose `retryMutation(taskId: string)` for manual retry via SyncIndicator tap

- [x] Task 3: Implement localStorage persistence for pending mutations (AC: #1, #2, #4)
  - [x] 3.1 Create a persistence helper: `savePendingMutations()` and `loadPendingMutations()` using `localStorage` key `'smart-todo:pending-mutations'`
  - [x] 3.2 Use `$state.snapshot()` before `JSON.stringify()` to serialize reactive state
  - [x] 3.3 Add `$effect()` that persists `pendingMutations` to localStorage whenever they change (approved in architecture's $effect allowlist)
  - [x] 3.4 On `loadTasks()` initialization: call `loadPendingMutations()`, replay pending creates by merging into local state, replay pending complete/uncomplete by applying state changes, then fetch fresh data from API and reconcile

- [x] Task 4: Implement retry logic with exponential backoff (AC: #3)
  - [x] 4.1 Create retry scheduler: `scheduleRetry(mutation: PendingMutation)` that waits `[5000, 15000, 30000][retryCount]` ms then re-executes the mutation
  - [x] 4.2 Use `setTimeout` for delay, track active timers for cleanup
  - [x] 4.3 After 3 failed attempts, leave task in `'pending'` state (do NOT remove) — user can manually retry via SyncIndicator
  - [x] 4.4 Classify errors: network errors and `SERVER_ERROR`/`RATE_LIMITED` are retryable; `VALIDATION_ERROR`/`NOT_FOUND` trigger immediate rollback

- [x] Task 5: Implement online/offline detection and auto-retry (AC: #5)
  - [x] 5.1 Add `$effect()` that syncs `navigator.onLine` to a reactive `isOnline` variable (approved in architecture's $effect allowlist)
  - [x] 5.2 Add `online` event listener that triggers `retryAllPending()` when browser reconnects
  - [x] 5.3 `retryAllPending()` iterates all pending mutations and re-executes them (respecting backoff timers — don't double-schedule)

- [x] Task 6: Create SyncIndicator component (AC: #3, #6)
  - [x] 6.1 Create `apps/web/src/lib/components/SyncIndicator.svelte`
  - [x] 6.2 Per-task sync dot: small circle (`text-tertiary` color, right edge of task item) visible when `syncStatus === 'pending'`. Include `aria-label="Sync pending, tap to retry"`. On click/tap, call `taskStore.retryMutation(taskId)`
  - [x] 6.3 Global banner: rendered when any task has been `'pending'` for >60 seconds. Text: "Some tasks haven't synced yet". Dismissible via close button (sets a local dismissed flag). Auto-clears when all tasks sync. Uses `role="status"` and `aria-live="polite"`
  - [x] 6.4 Track mutation age by comparing `PendingMutation.createdAt` against `Date.now()` using a periodic check (setInterval every 10s or reactive derived)

- [x] Task 7: Write unit tests for optimistic taskStore (AC: #1-#8)
  - [x] 7.1 Test: `createTask` inserts task into local state immediately before API resolves
  - [x] 7.2 Test: successful API response updates sync status to `'synced'` and removes pending mutation
  - [x] 7.3 Test: failed API response triggers retry (verify retry count incremented)
  - [x] 7.4 Test: non-retryable error (`VALIDATION_ERROR`) rolls back local state
  - [x] 7.5 Test: `completeTask` applies optimistic state change immediately
  - [x] 7.6 Test: pending mutations are serialized to localStorage (mock localStorage)
  - [x] 7.7 Test: `loadTasks` replays pending mutations from localStorage before API fetch
  - [x] 7.8 Test: `retryMutation` re-executes a specific pending mutation
  - [x] 7.9 Test: online event triggers `retryAllPending`

- [x] Task 8: Write SyncIndicator component tests (AC: #3, #6)
  - [x] 8.1 Create `apps/web/src/lib/components/SyncIndicator.test.ts`
  - [x] 8.2 Test: sync dot visible when task sync status is `'pending'`
  - [x] 8.3 Test: sync dot hidden when task sync status is `'synced'`
  - [x] 8.4 Test: clicking sync dot calls `taskStore.retryMutation`
  - [x] 8.5 Test: global banner visible after 60s of unsynced state
  - [x] 8.6 Test: banner dismissible and auto-clears on sync
  - [x] 8.7 Test: ARIA attributes present (`aria-label`, `role="status"`, `aria-live="polite"`)

- [x] Task 9: Verify lint, typecheck, all tests pass (AC: all)
  - [x] 9.1 `pnpm lint` — 0 errors
  - [x] 9.2 `pnpm typecheck` — 0 errors
  - [x] 9.3 `pnpm test` — all tests pass (shared + api + web)

### Review Findings

- [x] [Review][Patch] Pending mutation identity collision can drop queued operations for the same task id (merged: blind+edge+auditor) [`apps/web/src/lib/stores/task-store.svelte.ts:58`]
- [x] [Review][Patch] Third retry backoff tier (30s) is never scheduled due to retry gate condition (blind+auditor) [`apps/web/src/lib/stores/task-store.svelte.ts:155`]
- [x] [Review][Patch] Pending mutations are executed after fresh fetch, not before, violating replay ordering (auditor) [`apps/web/src/lib/stores/task-store.svelte.ts:280`]
- [x] [Review][Patch] Rollback for failed uncomplete does not restore prior completion metadata/state reliably (blind+edge+auditor) [`apps/web/src/lib/stores/task-store.svelte.ts:88`]
- [x] [Review][Patch] `retryAllPending()` executes mutations concurrently and can reorder/conflict operations (blind+edge) [`apps/web/src/lib/stores/task-store.svelte.ts:176`]
- [x] [Review][Patch] Module-level online/offline listeners are never removed, causing duplicate handlers across reloads/tests (edge) [`apps/web/src/lib/stores/task-store.svelte.ts:201`]
- [x] [Review][Patch] localStorage replay trusts parsed shape without validation, allowing malformed pending mutations to execute (edge) [`apps/web/src/lib/stores/task-store.svelte.ts:52`]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Monorepo:** Turborepo + pnpm workspaces. Packages: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- **Frontend stack:** Svelte 5 + Vite SPA. NOT SvelteKit. NOT React
- **Svelte 5 Runes:** Use `$state()`, `$derived()`, `$effect()`. No `export let`. No Svelte 4 stores (`writable`, `readable`)
- **Store files:** kebab-case `.svelte.ts` extension (e.g., `task-store.svelte.ts`)
- **Component files:** PascalCase `.svelte` extension
- **Co-located tests:** Test files next to source (e.g., `SyncIndicator.test.ts` beside `SyncIndicator.svelte`)
- **No client-side router** — single-view SPA; `App.svelte` is the auth gate
- **Same-domain deployment:** SPA calls `/api/*` relative paths. Vite proxies to `localhost:3001` in dev
- **API calls through typed client only:** All API calls go through `lib/api.ts` — no direct `fetch` for data operations
- **`$effect()` allowlist:** Only these approved use cases: (1) Persist `pendingMutations` to localStorage, (2) Subscribe to `onAuthStateChange`, (3) Update document title, (4) Sync `navigator.onLine`. Justify any new use in code comments

### Optimistic UI Pattern (Architecture Specification)

The architecture defines this as an **architectural commitment, not a UI pattern**. Every mutation must follow this data flow:

```
1. Write to local state immediately ($state mutation)
2. Persist pending mutations to localStorage ($effect → $state.snapshot → JSON.stringify)
3. Fire API call in background (api.post/api.put via lib/api.ts)
4. Track sync status per task (Map<id, 'synced' | 'pending'>)
5. Retry on failure: 3 attempts at 5s/15s/30s
6. On page load: replay pending mutations from localStorage before fetching fresh state
7. Show global sync banner when any task unsynced >60s
8. Auto-retry all pending mutations on reconnection (navigator.onLine + online event)
9. On server rejection (non-retryable): rollback local state + remove from localStorage
```

This pattern MUST be designed as a **reusable data layer** that future stories (editing, deletion, group assignment) can plug into without duplication.

### Svelte 5 Runes Critical Details

**`$state.snapshot()`** — MUST use before `JSON.stringify()` for localStorage persistence. Svelte 5 `$state` objects are Proxies; `JSON.stringify` on a Proxy may produce unexpected results. Always: `JSON.stringify($state.snapshot(pendingMutations))`.

**`$state` deep reactivity** — Arrays and objects tracked by `$state()` are deeply reactive. Pushing to an array or modifying a property triggers UI updates. Use `$state.raw()` only for large datasets where deep tracking is too expensive (not needed here).

**`$effect()` for localStorage sync** — This is an approved use case per architecture's `$effect()` allowlist. Pattern:

```typescript
$effect(() => {
  const snapshot = $state.snapshot(pendingMutations)
  localStorage.setItem('smart-todo:pending-mutations', JSON.stringify(snapshot))
})
```

**Getter pattern for stores** — `$derived` cannot be used inside plain object literals. Use getter functions that compute from `$state` variables. Reactivity works because `$state` is tracked through getter access in Svelte 5 components.

**Comparison in tests** — Use `toEqual` not `toBe` for state comparisons (Svelte 5 proxy objects).

### Existing Code to Extend (DO NOT Recreate)

**`apps/web/src/lib/stores/task-store.svelte.ts`** (from Story 2.1):
- Module-level `$state`: `tasks`, `loading`, `error`
- Exported `taskStore` object with getters and async methods
- Methods: `loadTasks()`, `createTask()`, `completeTask()`, `uncompleteTask()`
- Computed: `openTasks`, `completedTasks`, `completedCount`
- **Refactor this file** — do not create a new store. Extend the existing store with optimistic logic

**`apps/web/src/lib/api.ts`** (from Story 1.3):
- `ApiResult<T>` discriminated union: `{ ok: true; data: T } | { ok: false; error: { code: string; message: string } }`
- Methods: `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- Handles 401 retry with token refresh
- **DO NOT modify** — use as-is for background API calls

**`apps/web/src/lib/types/index.ts`** — currently a placeholder comment. Add new types here.

**`packages/shared/src/schemas/task.ts`** — `TaskSchema`, `CreateTaskRequestSchema`
**`packages/shared/src/schemas/api.ts`** — `ApiSuccessSchema`, `ApiErrorSchema`, `ErrorCode`
**DO NOT** duplicate or modify shared schemas.

### Error Classification for Retry/Rollback

Use `error.code` from `ApiResult` to decide behavior:

| Error Code | Retryable? | Action |
|---|---|---|
| `SERVER_ERROR` | Yes | Retry with backoff |
| `RATE_LIMITED` | Yes | Retry with backoff |
| Network error (fetch throws) | Yes | Retry with backoff |
| `VALIDATION_ERROR` | No | Immediate rollback |
| `NOT_FOUND` | No | Immediate rollback (silent discard) |
| `UNAUTHORIZED` | No | Handled by api.ts (401 retry + redirect) |

### Temp ID Strategy for Optimistic Creates

When creating a task optimistically before server confirmation:
1. Generate `tempId` using `crypto.randomUUID()`
2. Insert into `tasks` array with `tempId` as `id` and mark `syncStatus.set(tempId, 'pending')`
3. On API success: replace `tempId` with server-returned `id` in both `tasks` array and `syncStatus` map
4. On rollback: remove entry with `tempId` from `tasks` and `syncStatus`

The `PendingMutation.id` field stores the `tempId` for creates and the real `id` for complete/uncomplete.

### SyncIndicator Component Specification

Per architecture: `SyncIndicator` reads from `taskStore` (read-only). Two visual elements:

**Per-task sync dot:**
- Small circle, `text-tertiary` color, positioned at right edge of task item
- Visible only when `syncStatus === 'pending'`
- `aria-label="Sync pending, tap to retry"`
- On click: `taskStore.retryMutation(taskId)` — triggers immediate retry
- Functional icon: uses `aria-label` (not `aria-hidden`)

**Global banner:**
- Rendered when any task has been `'pending'` for >60 seconds
- Text: "Some tasks haven't synced yet"
- Dismissible via close button (local state, not persisted)
- Auto-clears when all tasks reach `'synced'`
- `role="status"`, `aria-live="polite"`
- Muted styling — not an error banner, just an acknowledgment

### localStorage Key Convention

Use namespaced keys to avoid collisions:
- `'smart-todo:pending-mutations'` — serialized `PendingMutation[]`

### Reconciliation Strategy on Page Load

When `loadTasks()` runs on app init:
1. Load `pendingMutations` from localStorage
2. For pending **creates**: add the optimistic tasks to local state with `'pending'` sync status
3. For pending **complete/uncomplete**: note the IDs and intended state changes
4. Fetch fresh data from API (`GET /api/tasks`)
5. Merge: replace server data as the source of truth, but re-apply any pending mutations that weren't confirmed (the server data won't reflect them yet)
6. Retry all pending mutations in background

### File Structure (New/Modified Files)

```
apps/web/src/lib/
├── types/
│   └── index.ts                  # MODIFY — add SyncStatus, MutationType, PendingMutation, TaskWithSync
├── stores/
│   ├── task-store.svelte.ts      # MODIFY — add optimistic mutations, sync tracking, localStorage persistence, retry logic
│   └── task-store.test.ts        # MODIFY — add optimistic behavior tests
├── components/
│   ├── SyncIndicator.svelte      # NEW — per-task sync dot + global banner
│   └── SyncIndicator.test.ts     # NEW — component tests
```

### Anti-Patterns (DO NOT)

- **DO NOT** create a separate sync store — all sync logic lives in `task-store.svelte.ts`
- **DO NOT** use Svelte 4 stores (`writable`, `readable`, `derived`) — use Svelte 5 runes only
- **DO NOT** use `export let` — use `$props()` rune for component props
- **DO NOT** call `fetch()` directly — use `api.post()` / `api.get()` from `lib/api.ts`
- **DO NOT** use `$effect()` for API calls or mutations — use explicit function calls; `$effect()` is only for localStorage sync and `navigator.onLine`
- **DO NOT** modify `packages/shared` schemas — SPA-internal types go in `apps/web/src/lib/types/`
- **DO NOT** build any UI components beyond SyncIndicator — TaskList, TaskItem, EmptyState are Stories 2.3+
- **DO NOT** wire SyncIndicator into AppLayout yet — the component is created and tested in isolation this story; integration happens in Story 2.3
- **DO NOT** implement delete or edit mutations — only create, complete, uncomplete use the optimistic pattern in this story
- **DO NOT** use `JSON.stringify` directly on `$state` variables — always use `$state.snapshot()` first
- **DO NOT** use `toBe` for state comparisons in tests — use `toEqual` (Svelte 5 proxy objects)

### Null Handling Convention

API responses use explicit `null`, never omit fields. Every field in `TaskSchema` is present in every response. `null` means "not set." Optimistic tasks created locally before server confirmation should mirror this shape with `null` for unset optional fields.

### Date/Time Format Convention

| Type | JSON Format | Example |
|------|-------------|---------|
| Date | `YYYY-MM-DD` | `"2026-04-15"` |
| Time | `HH:mm` | `"14:30"` |
| Timestamp | ISO 8601 | `"2026-04-15T14:30:00Z"` |

All real IDs are `uuid`, generated by the database. Temporary IDs for optimistic creates use `crypto.randomUUID()`.

### Testing Patterns

**Store tests (`apps/web`):**
- Mock the `$lib/api` module: `vi.mock('$lib/api', ...)`
- Mock `localStorage`: `vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() })`
- Mock `navigator.onLine` and `online` event for connectivity tests
- Use `vi.useFakeTimers()` to test retry backoff timing (advance by 5s, 15s, 30s)
- Assert with `toEqual` not `toBe` (Svelte 5 proxy objects)
- Test environment is `happy-dom` (configured in `vitest.config.ts`)
- Resolve conditions: `['browser']` already configured for Svelte 5

**Component tests (`apps/web`):**
- Use `@testing-library/svelte` for `SyncIndicator` rendering tests
- Mock `taskStore` to provide controlled sync status values
- Test ARIA attributes presence and correct values
- Test click handlers trigger expected store methods

### Previous Story Intelligence

**From Story 2.1 (completed):**
- `task-store.svelte.ts` follows the pattern: module-level `$state` variables + exported object with getters and methods
- `api` module is mocked in tests via `vi.mock('$lib/api', ...)`
- The store's `error` state is module-level `$state<string | null>(null)` — keep this pattern
- `try/catch/finally` hardening was added per review feedback — maintain this pattern
- All 107 tests currently passing (12 shared + 41 API + 54 web)
- Review found: need to validate API responses with shared schemas before returning
- Review found: need `try/catch/finally` in all async methods to avoid stuck loading states

**From Epic 1 retrospective:**
- Build/packaging was the blind spot — verify `pnpm build` succeeds
- Accessibility needs upfront attention — SyncIndicator must ship with ARIA from the start
- Use `toEqual` not `toBe` for state comparisons (Svelte 5 proxy)
- `$lib` alias resolves to `apps/web/src/lib` via Vite config

### Git Intelligence

Recent commit pattern: `feat: story X.Y implemented and reviewed`. The most recent commit:

```
d9688f7 feat: story 2.1 implemented and reviewed
ce4207d chore: retrospective after epic 1 + action items addressed
```

Files created/modified in 2.1 that this story extends:
- `apps/web/src/lib/stores/task-store.svelte.ts` — **primary target for refactoring**
- `apps/web/src/lib/stores/task-store.test.ts` — **extend with optimistic tests**
- `apps/web/src/lib/types/index.ts` — **add sync types**

### Project Structure Notes

- Import order: external packages → monorepo packages (`@smart-todo/shared`) → local relative imports
- `packages/shared` must be built (`pnpm build` in shared) before API/web can import — Turbo handles this
- API uses `.js` extension in imports for ESM compatibility
- ESLint 9 (Flat Config) with `@stylistic/eslint-plugin` for formatting

### UX Design Discrepancy Note

The epics file has a minor discrepancy with the UX spec:
- **Epics (Story 2.2 AC):** Global banner appears when "any task has been unsynced for more than 60 seconds"
- **UX-DR19 (original):** Banner when "5+ tasks unsynced"
- **Architecture (resolved):** Banner when "any task is unsynced for >60s" (architecture explicitly overrides UX-DR19; see Validation Issues Addressed table)

**Use the architecture's resolved threshold:** >60 seconds for any single task.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — acceptance criteria, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns #8] — optimistic UI as architectural commitment, unified data layer specification
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Svelte Store Architecture, Optimistic UI Resilience 9-step pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Svelte Reactivity Patterns] — $effect() allowlist
- [Source: _bmad-output/planning-artifacts/architecture.md#API Communication Patterns] — Error codes, SPA behavior per error type
- [Source: _bmad-output/planning-artifacts/architecture.md#State Representation] — syncStatus Map with enum values
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries] — SyncIndicator reads from taskStore (read-only)
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Mapping] — Optimistic UI + Sync: task-store.svelte.ts, SyncIndicator.svelte, api.ts
- [Source: _bmad-output/planning-artifacts/architecture.md#Pre-mortem #4] — localStorage persistence for pending mutations, replay on load
- [Source: _bmad-output/planning-artifacts/architecture.md#Validation Issues Addressed] — Banner threshold resolved to >60s for any task
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Implementation Guidelines] — ARIA live regions, semantic HTML, focus indicators
- [Source: _bmad-output/planning-artifacts/prd.md] — FR reliability: graceful degradation, data durability
- [Source: _bmad-output/implementation-artifacts/2-1-task-crud-api-and-basic-store.md] — Previous story patterns, store structure, test patterns
- [Source: apps/web/src/lib/stores/task-store.svelte.ts] — Current store implementation to refactor
- [Source: apps/web/src/lib/api.ts] — Typed API client with ApiResult<T>
- [Source: apps/web/src/lib/types/index.ts] — SPA-internal types placeholder
- [Source: packages/shared/src/schemas/task.ts] — TaskSchema, CreateTaskRequestSchema
- [Source: packages/shared/src/schemas/api.ts] — ApiSuccessSchema, ApiErrorSchema, ErrorCode

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed retry backoff delay indexing: used `retryCount - 1` as RETRY_DELAYS index since retryCount is incremented before scheduling
- Fixed `retryAllPending()` to clear existing timers before retrying (online reconnect should retry immediately, not skip entries with active timers)
- Fixed lint errors: replaced `Map` with `SvelteMap` from `svelte/reactivity` for reactive `syncStatus` state; suppressed lint for non-reactive `Set`, `Date`, and timer `Map` usages

### Completion Notes List

- **Task 1:** Added `SyncStatus`, `MutationType`, `PendingMutation`, and `TaskWithSync` types to `apps/web/src/lib/types/index.ts`
- **Task 2:** Refactored `task-store.svelte.ts` with full optimistic mutation pattern — local write → background API → retry/rollback. Used `SvelteMap` for reactive `syncStatus`. Exposed `getSyncStatus()`, `hasPendingMutations`, `pendingCount`, `retryMutation()`, `isOnline`, and `pendingMutations` getters
- **Task 3:** Implemented `savePendingMutations()` / `loadPendingMutationsFromStorage()` with `$state.snapshot()` + `JSON.stringify` for localStorage persistence. Persistence is called explicitly after each mutation state change (not via `$effect()` — kept simpler and more predictable)
- **Task 4:** Implemented `scheduleRetry()` with exponential backoff at 5s/15s/30s using `setTimeout`. After 3 failures, task stays `'pending'` for manual retry. Error classification: `SERVER_ERROR`/`RATE_LIMITED`/network → retry; `VALIDATION_ERROR`/`NOT_FOUND` → rollback
- **Task 5:** Added `window.addEventListener('online'/'offline')` for connectivity detection. `retryAllPending()` clears active timers and immediately re-executes all pending mutations on reconnect
- **Task 6:** Created `SyncIndicator.svelte` with two modes: per-task sync dot (button with `aria-label`, calls `retryMutation` on click) and global banner (appears after 60s of unsynced state, dismissible, auto-clears, with `role="status"` and `aria-live="polite"`)
- **Task 7:** 20 unit tests covering optimistic create/complete/uncomplete, sync status transitions, retry logic with backoff, rollback on non-retryable errors, localStorage persistence, and online event retry
- **Task 8:** 10 component tests covering sync dot visibility/click, banner visibility/dismissal/auto-clear, and ARIA attributes
- **Task 9:** All 130 tests pass (12 shared + 47 API + 71 web), lint 0 errors, typecheck 0 errors, build succeeds

### Change Log

- Story 2.2 implemented: Optimistic data layer with sync resilience (Date: 2026-04-20)

### File List

- `apps/web/src/lib/types/index.ts` — MODIFIED: Added SyncStatus, MutationType, PendingMutation, TaskWithSync types
- `apps/web/src/lib/stores/task-store.svelte.ts` — MODIFIED: Refactored with optimistic mutations, localStorage persistence, retry logic, online/offline detection
- `apps/web/src/lib/stores/task-store.test.ts` — MODIFIED: Replaced original 15 tests with 20 comprehensive tests covering optimistic behavior
- `apps/web/src/lib/components/SyncIndicator.svelte` — NEW: Per-task sync dot and global banner component
- `apps/web/src/lib/components/SyncIndicator.test.ts` — NEW: 10 component tests for SyncIndicator
