# Story 2.3: Basic Task List & Empty State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see my tasks in a list and be guided when I have none,
So that I can review what I've captured and know how to start.

## Acceptance Criteria

1. **Empty state display:** Given I am authenticated and have no tasks, when the app loads, then I see the EmptyState component with a warm icon (subtle, not cartoonish) and the text "Your task list is clear." The capture input area (placeholder, non-functional until Story 2.6) is visible in its responsive position.

2. **Task list rendering:** Given I have open tasks, when the app loads, then the EmptyState is not shown and I see a TaskList with my open tasks rendered as TaskItem components. Each TaskItem displays: title in loud voice (semibold 600, 17px), and a metadata row in quiet voice (regular 400, 14px) showing due date (human-readable relative format: "Today", "Next Monday", not ISO), priority badge (with correct color per UX-DR26), and location if present.

3. **Sort order preservation:** Given tasks exist with different priorities and due dates, when the task list renders, then tasks are displayed in the order returned by the API (priority-weighted with due date tiebreaker from Story 2.1).

4. **Completed count display:** Given I have completed tasks, when the app loads, then I see a completed count always visible at the bottom of the task list area showing the total number of completed tasks with warm amber treatment.

5. **New task entrance animation:** Given a new task is saved (via optimistic UI), when the task appears in the list, then it enters with a subtle opacity 0→1 transition over 200ms (settle timing). When prefers-reduced-motion is active, the task appears instantly with no animation.

6. **Touch target compliance:** Given I am viewing the task list, when I inspect the TaskItem touch targets, then the checkbox area is at least 44x44px and all interactive elements meet the minimum 44x44px touch target requirement.

7. **Empty state → task list transition:** Given the EmptyState is visible, when I save my first task, then the EmptyState disappears immediately (optimistic UI) and the task list appears with the new task.

8. **SyncIndicator integration:** Given Story 2.2 created SyncIndicator in isolation, when the task list renders, then the per-task sync dot is wired into each TaskItem (visible for tasks with `'pending'` sync status) and the global sync banner is rendered in AppLayout above the task list area.

**Note:** The suggested rich example placeholder text (FR36: "Call the dentist next Monday, high priority") is delivered with the functional CaptureInput in Story 2.6, completing the first-use revelation experience.

## Tasks / Subtasks

- [x] Task 1: Create date formatting utilities (AC: #2)
  - [x] 1.1 Create `apps/web/src/lib/utils/format.ts` with `formatRelativeDate(isoDate: string | null): string` function
  - [x] 1.2 Returns human-readable relative format: "Today", "Tomorrow", "Yesterday", "Monday" (this week), "Next Monday" (next week), "Apr 28" (same year, further away), "Apr 28 2027" (different year). Returns empty string for null input
  - [x] 1.3 Create `apps/web/src/lib/utils/format.test.ts` with tests covering all date formatting cases including edge cases (midnight boundaries, null input, invalid dates)

- [x] Task 2: Create TaskItem component (AC: #2, #5, #6, #8)
  - [x] 2.1 Create `apps/web/src/lib/components/TaskItem.svelte`
  - [x] 2.2 Props: `task: Task`, `onComplete: (id: string) => void`, `onUncomplete: (id: string) => void`, `syncStatus: SyncStatus`
  - [x] 2.3 Layout: horizontal flex — checkbox (left, 44x44px touch area) → content (title + metadata) → SyncIndicator dot (right, visible when pending)
  - [x] 2.4 Title: loud voice (`font-size: var(--font-size-loud)`, `font-weight: var(--font-weight-loud)`, `line-height: var(--line-height-loud)`, `text-text-primary`)
  - [x] 2.5 Metadata row: quiet voice (`font-size: var(--font-size-quiet)`, `font-weight: var(--font-weight-quiet)`, `text-text-secondary`) showing due date (via `formatRelativeDate`), priority badge, and location if present. Items separated by visual dots (·)
  - [x] 2.6 Priority badge colors per UX-DR26: Urgent (coral-500 bg, white text), High (coral-100 bg, coral-600 text), Medium (amber-100 bg, amber-900 text), Low (stone-100 bg, text-secondary text)
  - [x] 2.7 Checkbox: use Bits UI `Checkbox.Root` with `bind:checked`. On checked change, call `onComplete(task.id)` or `onUncomplete(task.id)`. Checkbox touch area 44x44px minimum
  - [x] 2.8 Completed task visual treatment: when `task.isCompleted`, text grays to text-tertiary, surface-completed tint on background, checkbox filled with amber-500
  - [x] 2.9 SyncIndicator dot: import `SyncIndicator` component from Story 2.2, pass `taskId={task.id}` and `mode="dot"`, position at right edge
  - [x] 2.10 Entry animation: use CSS `animation: fadeIn 200ms ease-out` with `@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`. Apply `motion-reduce:animate-none` for reduced motion preference
  - [x] 2.11 Item separator: 1px border-default between items (per UX-DR4)
  - [x] 2.12 Vertical padding: 12px (space-3) per task item anatomy (UX-DR4)

- [x] Task 3: Create TaskItem component tests (AC: #2, #5, #6, #8)
  - [x] 3.1 Create `apps/web/src/lib/components/TaskItem.test.ts`
  - [x] 3.2 Test: renders task title in loud voice typography
  - [x] 3.3 Test: renders due date in relative format (not ISO)
  - [x] 3.4 Test: renders priority badge with correct color classes per priority level
  - [x] 3.5 Test: renders location when present, hides when null
  - [x] 3.6 Test: checkbox calls `onComplete` when open task is checked
  - [x] 3.7 Test: checkbox calls `onUncomplete` when completed task is unchecked
  - [x] 3.8 Test: completed task shows grayed text and amber tint
  - [x] 3.9 Test: SyncIndicator dot visible when syncStatus is `'pending'`
  - [x] 3.10 Test: SyncIndicator dot hidden when syncStatus is `'synced'`
  - [x] 3.11 Test: checkbox touch area meets 44x44px minimum (check classes/dimensions)
  - [x] 3.12 Test: ARIA attributes on checkbox (accessible name for task)

- [x] Task 4: Create EmptyState component (AC: #1, #7)
  - [x] 4.1 Create `apps/web/src/lib/components/EmptyState.svelte`
  - [x] 4.2 No props needed — stateless component
  - [x] 4.3 Content: warm SVG icon (clipboard or check-circle, subtle line art, not cartoonish), "Your task list is clear." text in text-secondary color
  - [x] 4.4 Centered layout with generous vertical spacing
  - [x] 4.5 Icon should be approximately 48-64px, using text-tertiary color

- [x] Task 5: Create EmptyState component tests (AC: #1, #7)
  - [x] 5.1 Create `apps/web/src/lib/components/EmptyState.test.ts`
  - [x] 5.2 Test: renders "Your task list is clear." text
  - [x] 5.3 Test: renders warm icon (SVG present)
  - [x] 5.4 Test: component renders without props

- [x] Task 6: Create TaskList component (AC: #2, #3, #4, #7)
  - [x] 6.1 Create `apps/web/src/lib/components/TaskList.svelte`
  - [x] 6.2 Props: `tasks: Task[]`, `completedCount: number`, `onComplete: (id: string) => void`, `onUncomplete: (id: string) => void`, `getSyncStatus: (taskId: string) => SyncStatus`
  - [x] 6.3 Renders open tasks only (pre-filtered by parent) as TaskItem components in the order received (API sort order preserved)
  - [x] 6.4 Completed count footer: always visible, showing completed count with amber treatment. Text: "{N} completed" using `quiet` voice with `amber-400` highlight on the number. Hidden when count is 0 (no completed tasks yet — initial state before any completions)
  - [x] 6.5 Uses a `<ul>` with `role="list"` semantic markup, each TaskItem wrapped in `<li>`
  - [x] 6.6 The list has `aria-label="Task list"` for screen reader identification

- [x] Task 7: Create TaskList component tests (AC: #2, #3, #4, #7)
  - [x] 7.1 Create `apps/web/src/lib/components/TaskList.test.ts`
  - [x] 7.2 Test: renders correct number of TaskItem components for given tasks
  - [x] 7.3 Test: preserves task order from props (no client-side re-sorting)
  - [x] 7.4 Test: completed count shown with correct number when > 0
  - [x] 7.5 Test: completed count hidden when count is 0
  - [x] 7.6 Test: uses `<ul>` semantic list markup
  - [x] 7.7 Test: passes correct callbacks to TaskItem components

- [x] Task 8: Wire components into AppLayout (AC: #1, #2, #7, #8)
  - [x] 8.1 Modify `apps/web/src/lib/components/AppLayout.svelte`
  - [x] 8.2 Import `taskStore` and call `taskStore.loadTasks()` on mount (this already fires optimistic replay + API fetch from Story 2.2)
  - [x] 8.3 Import `TaskList`, `EmptyState`, `SyncIndicator`
  - [x] 8.4 In the main content area: if `taskStore.openTasks.length === 0 && !taskStore.loading && taskStore.completedCount === 0`, show EmptyState; otherwise show TaskList
  - [x] 8.5 Pass `taskStore.openTasks` to TaskList, wire `onComplete` to `taskStore.completeTask`, `onUncomplete` to `taskStore.uncompleteTask`, pass `taskStore.completedCount` and `taskStore.getSyncStatus`
  - [x] 8.6 Add SyncIndicator in banner mode above the main content area (below nav, inside max-width container): `<SyncIndicator mode="banner" />`
  - [x] 8.7 Show loading state while `taskStore.loading` is true (simple "Loading…" text, centered)
  - [x] 8.8 Keep placeholder capture input areas (desktop top, mobile bottom) as-is — non-functional until Story 2.6

- [x] Task 9: Verify lint, typecheck, all tests pass (AC: all)
  - [x] 9.1 `pnpm lint` — 0 errors
  - [x] 9.2 `pnpm typecheck` — 0 errors
  - [x] 9.3 `pnpm test` — all tests pass (shared + api + web, including all new tests)
  - [x] 9.4 `pnpm build` — succeeds (verify no test files bundled)

### Review Findings

- [x] [Review][Defer] Sync dot touch target compliance vs "do not modify SyncIndicator" constraint [apps/web/src/lib/components/SyncIndicator.svelte:53] — deferred, pre-existing. Reason: Following story note regarding scope of story.
- [x] [Review][Patch] Move `taskStore.loadTasks()` into lifecycle hook to avoid init-time side effects [apps/web/src/lib/components/AppLayout.svelte:14]
- [x] [Review][Patch] Add explicit load-error branch so failed fetch does not render empty-state success copy [apps/web/src/lib/components/AppLayout.svelte:69]
- [x] [Review][Patch] Define missing `@keyframes fadeIn` used by task item animation [apps/web/src/lib/components/TaskItem.svelte:45]
- [x] [Review][Patch] Harden `formatRelativeDate` parsing for ISO datetime input and invalid calendar dates [apps/web/src/lib/utils/format.ts:15]
- [x] [Review][Patch] Remove unused `syncStatus` prop plumbing or wire it as single source of truth [apps/web/src/lib/components/TaskList.svelte:29]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Monorepo:** Turborepo + pnpm workspaces. Packages: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- **Frontend stack:** Svelte 5 + Vite SPA. NOT SvelteKit. NOT React
- **Svelte 5 Runes:** Use `$state()`, `$derived()`, `$effect()`. No `export let`. No Svelte 4 stores (`writable`, `readable`)
- **Store files:** kebab-case `.svelte.ts` extension (e.g., `task-store.svelte.ts`)
- **Component files:** PascalCase `.svelte` extension
- **Co-located tests:** Test files next to source (e.g., `TaskItem.test.ts` beside `TaskItem.svelte`)
- **No client-side router** — single-view SPA; `App.svelte` is the auth gate
- **Same-domain deployment:** SPA calls `/api/*` relative paths. Vite proxies to `localhost:3001` in dev
- **API calls through typed client only:** All API calls go through `lib/api.ts` — no direct `fetch` for data operations
- **`$effect()` allowlist:** Only these approved use cases: (1) Persist `pendingMutations` to localStorage, (2) Subscribe to `onAuthStateChange`, (3) Update document title, (4) Sync `navigator.onLine`. Justify any new use in code comments
- **Callback props with `on` prefix:** Components receive callbacks like `onComplete`, `onDelete`, etc. No custom Svelte events
- **`$props()` rune:** Use `$props()` for component props. No `export let`

### Existing Code to Extend (DO NOT Recreate)

**`apps/web/src/lib/stores/task-store.svelte.ts`** (from Stories 2.1 + 2.2):
- Full optimistic data layer with sync resilience
- Module-level `$state`: `tasks`, `loading`, `error`, `pendingMutations`, `syncStatus` (SvelteMap), `isOnline`
- Exported `taskStore` object with getters and methods
- Key getters: `tasks`, `openTasks`, `completedTasks`, `completedCount`, `loading`, `error`, `isOnline`, `hasPendingMutations`, `pendingCount`, `pendingMutations`
- Key methods: `loadTasks()`, `createTask()`, `completeTask(id)`, `uncompleteTask(id)`, `retryMutation(taskId)`, `getSyncStatus(taskId)`
- `loadTasks()` replays pending mutations from localStorage, retries all pending, then fetches fresh from API
- **DO NOT modify this file** — consume it as-is from components

**`apps/web/src/lib/api.ts`** (from Story 1.3):
- `ApiResult<T>` discriminated union
- Methods: `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- Handles 401 retry with token refresh
- **DO NOT modify** — consumed by taskStore

**`apps/web/src/lib/components/SyncIndicator.svelte`** (from Story 2.2):
- Two modes: `mode="dot"` (per-task sync dot) and `mode="banner"` (global stale mutation banner)
- Props: `taskId?: string`, `mode?: 'dot' | 'banner'`
- Dot mode: small circle, `text-tertiary` color, visible only when `syncStatus === 'pending'`, click triggers `retryMutation`
- Banner mode: "Some tasks haven't synced yet" with dismiss, appears when any mutation >60s old
- **DO NOT modify** — import and use as-is

**`apps/web/src/lib/components/AppLayout.svelte`** (from Story 1.4):
- CSS Grid layout with header, nav placeholder, main area
- Desktop capture input placeholder (non-functional)
- Mobile bottom-docked capture input placeholder (non-functional)
- Skip-to-content link, ARIA landmarks
- **MODIFY this file** — replace main area placeholder with TaskList/EmptyState, add SyncIndicator banner

**`apps/web/src/lib/types/index.ts`** (from Story 2.2):
- Exports: `SyncStatus`, `MutationType`, `UpdateMutationPayload`, `MutationPayload`, `PendingMutation`, `TaskWithSync`
- **May add new types here if needed** (e.g., `PriorityColor` mapping)

**`packages/shared/src/schemas/task.ts`**:
- `TaskSchema`, `CreateTaskRequestSchema` with types: `Task`, `CreateTaskRequest`
- Task fields: `id`, `userId`, `title`, `dueDate` (nullable string YYYY-MM-DD), `dueTime` (nullable string HH:mm), `location` (nullable string), `priority` (nullable enum: 'low' | 'medium' | 'high' | 'urgent'), `groupId` (nullable), `isCompleted` (boolean), `completedAt` (nullable string ISO), `deletedAt` (nullable string ISO), `createdAt` (string ISO)
- **DO NOT modify shared schemas**

### UX Design Token Reference

Design tokens are already configured in `apps/web/src/app.css`:

**Typography:**
- Loud voice: `text-[length:var(--font-size-loud)] font-[number:var(--font-weight-loud)] leading-[var(--line-height-loud)]` — for task titles
- Quiet voice: `text-[length:var(--font-size-quiet)] font-[number:var(--font-weight-quiet)] leading-[var(--line-height-quiet)]` — for metadata, labels
- Input voice: `text-[length:var(--font-size-input)]` — for capture input (not used in this story)

**Colors available as Tailwind classes:**
- `text-text-primary`, `text-text-secondary`, `text-text-tertiary`
- `bg-surface`, `bg-surface-raised`, `bg-surface-completed`
- `bg-coral-100`, `bg-coral-500`, `bg-coral-600`, `text-coral-600`
- `bg-amber-100`, `bg-amber-400`, `bg-amber-500`, `bg-amber-900`, `text-amber-400`, `text-amber-500`, `text-amber-900`
- `border-border-default`, `border-border-focus`
- `ring-ring-focus`

**Animation tokens:**
- `duration-settle` (300ms), `duration-reveal` (250ms), `duration-snap` (100ms)
- Use 200ms for task entry fade-in (between snap and reveal timing)
- `motion-reduce:` prefix disables animations for prefers-reduced-motion

### Priority Badge Color System (UX-DR26)

| Priority | Background | Text | Border |
|----------|-----------|------|--------|
| `urgent` | `bg-coral-500` | `text-white` | none |
| `high` | `bg-coral-100` | `text-coral-600` | `border border-coral-500/50` |
| `medium` | `bg-amber-100` | `text-amber-900` | `border border-amber-500/50` |
| `low` | `bg-stone-100` | `text-text-secondary` | `border border-border-default` |

Badge shape: `rounded-full px-2 py-0.5 text-xs font-medium` (pill shape, quiet voice size)

### Date Display Format (UX-DR27)

Human-readable relative format. The `formatRelativeDate` function must return:

| Input | Display |
|-------|---------|
| Today's date | "Today" |
| Tomorrow | "Tomorrow" |
| Yesterday | "Yesterday" |
| This week (within 6 days) | Day name: "Monday", "Wednesday" |
| Next week (7-13 days) | "Next Monday", "Next Wednesday" |
| Same year, further | "Apr 28" (abbreviated month + day) |
| Different year | "Apr 28 2027" |
| `null` | Empty string (no display) |

Use the native `Intl.DateTimeFormat` API for locale-aware month names. Parse dates as local dates (not UTC) since `dueDate` is `YYYY-MM-DD` without timezone.

### Bits UI Checkbox Integration

Bits UI Checkbox is the accessible primitive for task completion. Usage pattern:

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui"
</script>

<Checkbox.Root
  checked={task.isCompleted}
  onCheckedChange={(checked) => {
    if (checked) onComplete(task.id)
    else onUncomplete(task.id)
  }}
  class="..."
  aria-label="Mark {task.title} as {task.isCompleted ? 'incomplete' : 'complete'}"
>
  {#snippet children({ checked })}
    {#if checked}
      <!-- Checkmark SVG icon -->
    {/if}
  {/snippet}
</Checkbox.Root>
```

Key points:
- `onCheckedChange` callback fires when user toggles — use this to call `onComplete`/`onUncomplete`
- `checked` prop controls the visual state (reflects `task.isCompleted`)
- `{#snippet children({ checked })}` provides render slot for custom checkmark visuals
- Must include `aria-label` with the task title for screen reader context
- Checkbox container must be 44x44px minimum (wrap in a div with `min-w-[44px] min-h-[44px] flex items-center justify-center`)

### Completed Count Display

The completed count sits at the bottom of the task list area:
- Always visible when `completedCount > 0`
- Hidden when `completedCount === 0` (fresh user with no completed tasks)
- Format: "N completed" where N uses amber-400 color highlight
- Quiet voice typography
- Centered or left-aligned within the max-width container
- This is a *simple count* in this story — the full CompletedSection with expand/collapse and temporal framing is delivered in Story 3.2

### Component Hierarchy

```
AppLayout.svelte (MODIFY)
├── header (existing)
├── nav placeholder (existing)
├── SyncIndicator mode="banner" (NEW - wire in)
├── main content area:
│   ├── EmptyState (NEW - shown when no tasks and not loading)
│   └── TaskList (NEW - shown when tasks exist)
│       ├── TaskItem (NEW - one per open task)
│       │   ├── Checkbox (Bits UI)
│       │   ├── title + metadata
│       │   └── SyncIndicator mode="dot" (EXISTING - wire in)
│       └── Completed count footer
├── desktop capture placeholder (existing)
└── mobile capture placeholder (existing)
```

### Conditional Rendering Logic in AppLayout

```
if taskStore.loading:
  → Show "Loading…" centered text
else if taskStore.openTasks.length === 0 && taskStore.completedCount === 0:
  → Show EmptyState
else:
  → Show TaskList with open tasks and completed count
```

When a user has only completed tasks (all tasks complete, none open), they still see the TaskList with an empty list and the completed count. EmptyState only appears when there are truly zero tasks of any kind.

### Entry Animation for New Tasks

Use a CSS keyframe animation that applies when a task first renders:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

Apply via Tailwind: `animate-[fadeIn_200ms_ease-out]` with `motion-reduce:animate-none`.

The animation only plays on initial mount. Subsequent re-renders don't re-trigger it. Svelte's `{#each}` with a `key` ensures proper item identity.

### File Structure (New/Modified Files)

```
apps/web/src/lib/
├── utils/
│   ├── format.ts                  # NEW — formatRelativeDate() utility
│   └── format.test.ts             # NEW — date format tests
├── components/
│   ├── AppLayout.svelte           # MODIFY — wire in TaskList, EmptyState, SyncIndicator banner
│   ├── EmptyState.svelte          # NEW — empty state with warm icon
│   ├── EmptyState.test.ts         # NEW — component tests
│   ├── TaskItem.svelte            # NEW — individual task display with checkbox
│   ├── TaskItem.test.ts           # NEW — component tests
│   ├── TaskList.svelte            # NEW — task list container with completed count
│   ├── TaskList.test.ts           # NEW — component tests
│   ├── SyncIndicator.svelte       # EXISTING — no changes, imported by TaskItem and AppLayout
│   └── SyncIndicator.test.ts      # EXISTING — no changes
├── stores/
│   └── task-store.svelte.ts       # EXISTING — no changes, consumed by AppLayout
└── types/
    └── index.ts                   # EXISTING — may add PriorityColor type if useful
```

### Anti-Patterns (DO NOT)

- **DO NOT** create a separate `CompletedSection` component — that's Story 3.2. This story shows only a simple completed count
- **DO NOT** implement temporal grouping (Today/This Week/Later) — that's Story 3.1
- **DO NOT** implement task editing or deletion — those are Stories 3.3 and 3.4
- **DO NOT** make the capture input functional — it remains a placeholder until Story 2.6
- **DO NOT** implement the task completion animation (checkbox fill, amber tint spreading) — that's Story 2.4. In this story, completed tasks are shown with static completed visual treatment only
- **DO NOT** modify `task-store.svelte.ts` — consume it as-is. If you need computed values, derive them in the component or AppLayout
- **DO NOT** modify `SyncIndicator.svelte` — import and use the existing component
- **DO NOT** use `export let` — use `$props()` rune for all component props
- **DO NOT** use Svelte 4 stores (`writable`, `readable`) — use Svelte 5 runes only
- **DO NOT** call `fetch()` directly — all data comes from `taskStore`
- **DO NOT** add new `$effect()` calls unless absolutely necessary and justified. Data loading is triggered by `taskStore.loadTasks()` called imperatively, not via `$effect()`
- **DO NOT** install new npm dependencies — use Bits UI (already installed), Tailwind (already configured), and native browser APIs (`Intl.DateTimeFormat`) for date formatting

### Testing Patterns

**Component tests (`apps/web`):**
- Use `@testing-library/svelte` with `render()` and `screen` queries
- Mock `taskStore` module: `vi.mock('$lib/stores/task-store.svelte', ...)` for AppLayout tests that import taskStore
- For TaskItem/TaskList: pass data directly as props — no store mocking needed
- For EmptyState: no mocks needed — stateless component
- Assert with `toEqual` not `toBe` (Svelte 5 proxy objects)
- Test environment is `happy-dom` (configured in `vitest.config.ts`)
- Resolve conditions: `['browser']` already configured for Svelte 5

**Bits UI Checkbox in tests:**
- Bits UI components may need to be mocked in unit tests if they cause rendering issues in happy-dom
- Alternative: test checkbox behavior through ARIA attributes and click events rather than Bits UI internals
- Use `fireEvent.click()` or `userEvent.click()` on the checkbox element to test completion callbacks

### Previous Story Intelligence

**From Story 2.2 (completed):**
- `SyncIndicator.svelte` is created and tested but NOT integrated into AppLayout yet — this story does the integration
- `task-store.svelte.ts` has full optimistic mutation pattern with `SvelteMap` for `syncStatus`
- `getSyncStatus(taskId)` returns `'synced'` by default if not in the map
- `pendingMutations` getter exposes the raw array for SyncIndicator's stale check
- Review fixed 7 issues including: mutation identity collisions, retry backoff bugs, replay ordering, rollback reliability, concurrent mutation conflicts, listener cleanup, and localStorage validation
- All 130 tests passing (12 shared + 47 API + 71 web)

**From Story 2.1 (completed):**
- API returns tasks sorted by priority weight (urgent > high > medium > low > null) with `due_date` as tiebreaker
- `createTask()` accepts `CreateTaskRequest`: `{ title, dueDate, dueTime, location, priority, groupId }`
- `taskStore.loadTasks()` must be called on init — it fetches from `GET /api/tasks`

**From Epic 1 retrospective:**
- Build/packaging was the blind spot — verify `pnpm build` succeeds
- Accessibility needs upfront attention — all components must ship with ARIA from the start
- Use `toEqual` not `toBe` for state comparisons (Svelte 5 proxy)
- `$lib` alias resolves to `apps/web/src/lib` via Vite config

### Git Intelligence

Recent commit: `5b4372a feat: story 2.2 implemented and reviewed`

Files modified in 2.2 that are consumed (NOT modified) by this story:
- `apps/web/src/lib/stores/task-store.svelte.ts` — optimistic data layer (consume via import)
- `apps/web/src/lib/components/SyncIndicator.svelte` — sync dot/banner (import into TaskItem/AppLayout)
- `apps/web/src/lib/types/index.ts` — `SyncStatus` type (import for TaskItem props)

Files modified by this story:
- `apps/web/src/lib/components/AppLayout.svelte` — the main integration point

### Null Handling Convention

API responses use explicit `null`, never omit fields. When rendering, check for `null` before displaying optional metadata:
- `task.dueDate !== null` → show formatted date
- `task.priority !== null` → show priority badge
- `task.location !== null` → show location text
- Metadata row dots (·) only appear between *visible* metadata items

### Import Order Convention

```typescript
// 1. External packages
import { Checkbox } from 'bits-ui'
import type { Task } from '@smart-todo/shared'

// 2. Monorepo packages (none needed in components — types come from shared)

// 3. Local imports (relative)
import SyncIndicator from '$lib/components/SyncIndicator.svelte'
import { formatRelativeDate } from '$lib/utils/format'
import type { SyncStatus } from '$lib/types'
```

### Project Structure Notes

- `packages/shared` must be built (`pnpm build` in shared) before API/web can import — Turbo handles this
- ESLint 9 (Flat Config) with `@stylistic/eslint-plugin` for formatting
- Tailwind CSS v4 with CSS-first configuration in `app.css`
- `stone-100` for low-priority badge background — if not in the theme, use `#F5F5F4` (shimmer-base) as fallback or add to theme

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — acceptance criteria, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Svelte Store Architecture, component boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries] — TaskList, TaskItem, EmptyState, SyncIndicator hierarchy
- [Source: _bmad-output/planning-artifacts/architecture.md#AppLayout Conditional Rendering] — captureStore.state → component visibility table
- [Source: _bmad-output/planning-artifacts/architecture.md#Svelte Reactivity Patterns] — $effect() allowlist, component file structure, props pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Conventions] — PascalCase components, kebab-case files
- [Source: _bmad-output/planning-artifacts/architecture.md#UX Spec Primitive Mapping] — Bits UI Checkbox for TaskItem completion
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR4] — 4px base spacing unit, task item anatomy (12px vertical padding, 8px checkbox-to-title gap)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR10] — temporal grouping (deferred to Story 3.1)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR16] — empty state: "Your task list is clear." warm icon, disappears on first save
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR19] — optimistic UI, per-task sync dot, global banner
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR20] — prefers-reduced-motion handling
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR23] — silent feedback pattern (no toasts, no banners for success)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR26] — priority badge color system
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR27] — human-readable relative date format
- [Source: _bmad-output/implementation-artifacts/2-2-optimistic-data-layer-and-sync-resilience.md] — previous story patterns, SyncIndicator spec, store API
- [Source: apps/web/src/lib/stores/task-store.svelte.ts] — current store implementation to consume
- [Source: apps/web/src/lib/components/SyncIndicator.svelte] — sync indicator to integrate
- [Source: apps/web/src/lib/components/AppLayout.svelte] — current layout to modify
- [Source: apps/web/src/app.css] — design token configuration
- [Source: packages/shared/src/schemas/task.ts] — TaskSchema, Task type definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- bits-ui was not pre-installed despite story notes claiming it was; added `bits-ui@^2.18.0` to `apps/web` dependencies
- Fixed missing `afterEach` import in TaskItem.test.ts
- Fixed missing `beforeEach` import in AppLayout.test.ts
- Fixed lint errors: import ordering in test files, missing `{#each}` key in TaskItem.svelte

### Completion Notes List

- ✅ Task 1: Created `formatRelativeDate` utility with full relative date formatting (Today, Tomorrow, Yesterday, day names, Next X, month+day, year). 11 tests covering all cases including null, invalid, midnight boundaries.
- ✅ Task 2: Created TaskItem component with Bits UI Checkbox, loud/quiet voice typography, priority badges per UX-DR26 colors, SyncIndicator dot integration, 200ms fade-in entry animation with motion-reduce, 44x44px touch targets, completed task visual treatment.
- ✅ Task 3: 17 TaskItem tests covering title rendering, relative date format, priority badge colors for all 4 levels, location show/hide, checkbox completion/uncompletion callbacks, completed task styling, SyncIndicator visibility, touch target compliance, ARIA attributes, metadata dot separators.
- ✅ Task 4: Created EmptyState component with clipboard+checkmark SVG icon (subtle line art, 56px, text-tertiary), centered "Your task list is clear." message, generous vertical spacing.
- ✅ Task 5: 3 EmptyState tests covering text content, SVG presence, and no-props rendering.
- ✅ Task 6: Created TaskList component with semantic `<ul>` list, TaskItem rendering per task, completed count footer with amber-400 highlight (hidden when 0), `aria-label="Task list"`.
- ✅ Task 7: 6 TaskList tests covering item count, order preservation, completed count visibility, semantic markup, and callback passing.
- ✅ Task 8: Wired TaskList, EmptyState, and SyncIndicator banner into AppLayout. Added conditional rendering (loading → EmptyState → TaskList), `taskStore.loadTasks()` call, sync banner in dedicated grid area. Updated AppLayout tests to mock taskStore (14 tests covering all states).
- ✅ Task 9: All validations pass — lint 0 errors, typecheck 0 errors, 171 tests pass (12 shared + 47 API + 112 web), build succeeds.

### Change Log

- 2026-04-20: Story 2.3 implemented — Basic Task List & Empty State with all 9 tasks complete

### File List

New files:
- apps/web/src/lib/utils/format.ts
- apps/web/src/lib/utils/format.test.ts
- apps/web/src/lib/components/TaskItem.svelte
- apps/web/src/lib/components/TaskItem.test.ts
- apps/web/src/lib/components/EmptyState.svelte
- apps/web/src/lib/components/EmptyState.test.ts
- apps/web/src/lib/components/TaskList.svelte
- apps/web/src/lib/components/TaskList.test.ts

Modified files:
- apps/web/src/lib/components/AppLayout.svelte
- apps/web/src/lib/components/AppLayout.test.ts
- apps/web/package.json (added bits-ui dependency)
