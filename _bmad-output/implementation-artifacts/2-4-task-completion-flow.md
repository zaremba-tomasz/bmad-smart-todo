# Story 2.4: Task Completion Flow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to mark tasks as complete and see my progress growing,
So that I feel the satisfaction of getting things done.

## Acceptance Criteria

1. **Completion animation:** Given I have an open task in my list, when I tap the checkbox, then the task is marked as complete via POST /api/tasks/:id/complete (optimistic UI — visual feedback is instant) and a 300ms non-blocking animation plays: checkbox fills with amber-500, text grays to text-tertiary, amber tint (surface-completed) spreads across the task item. The completed count increments visibly (+1). An ARIA live region announces "Task completed. N tasks completed."

2. **Rapid parallel completions:** Given I mark multiple tasks complete rapidly, when I tap checkboxes in quick succession, then each animation fires independently and in parallel — no blocking, no queuing. The count increments for each completion.

3. **Uncomplete flow:** Given I completed a task, when the task is in the completed state and I tap its checkbox again, then the task is returned to the open list via POST /api/tasks/:id/uncomplete (optimistic UI). The completion visual treatment is reversed (animated back). The completed count decrements.

4. **Completed tasks stay in place:** Given I completed a task, when it remains in the task list, then the completed task stays in place with completed visual treatment (grayed text, amber tint, filled checkbox). It does NOT relocate to a separate section — completed tasks remain in the active list in this story. Relocation to the full CompletedSection is delivered in Story 3.2.

5. **Reduced motion:** Given a user prefers reduced motion, when they mark a task complete, then the completion visual treatment applies instantly (no animation).

6. **Failed sync preservation:** Given the complete/uncomplete API call fails, when the retry logic exhausts (3 attempts), then the task shows a sync dot indicating the completion state hasn't been persisted. The local optimistic state is preserved.

## Tasks / Subtasks

- [x] Task 1: Add CSS transitions for completion animation to TaskItem (AC: #1, #2, #5)
  - [x] 1.1 Modify `apps/web/src/lib/components/TaskItem.svelte` — replace static completed class bindings with CSS `transition` properties on the affected elements (checkbox border/background, title text color, task item background color). Use `duration-settle` (300ms) with `ease-in-out` timing
  - [x] 1.2 Checkbox: `transition: border-color 300ms ease-in-out, background-color 300ms ease-in-out` — the amber-500 fill should transition, not snap
  - [x] 1.3 Title text: `transition: color 300ms ease-in-out` — the text-primary → text-tertiary gray should transition
  - [x] 1.4 Task item background: `transition: background-color 300ms ease-in-out` — the surface → surface-completed amber tint should spread
  - [x] 1.5 Checkmark SVG icon: appears immediately on check (no fade needed for the icon itself — the container fill IS the animation)
  - [x] 1.6 Apply `motion-reduce:transition-none` to all transitioning elements so reduced-motion users get instant treatment
  - [x] 1.7 Ensure the existing `animate-[fadeIn_200ms_ease-out]` entry animation is NOT affected — it runs on mount only, the completion transition is separate

- [x] Task 2: Add ARIA live region for completion announcements (AC: #1, #3)
  - [x] 2.1 Add an ARIA live region (`role="status"`, `aria-live="polite"`) to `TaskList.svelte` — a visually hidden element that announces completion/uncompletion events
  - [x] 2.2 When a task is completed (checkbox toggles to checked), set announcement text to: `"Task completed. {N} tasks completed."` where N is the updated `completedCount`
  - [x] 2.3 When a task is uncompleted (checkbox toggles to unchecked), set announcement text to: `"Task reopened. {N} tasks completed."` where N is the updated `completedCount`
  - [x] 2.4 Use a `$state` variable for the announcement text. Clear it after ~1 second to prevent stale announcements on subsequent interactions. Use `setTimeout` to clear (not `$effect`)
  - [x] 2.5 The live region must be permanently in the DOM (not conditionally rendered) — only the text content changes. Screen readers ignore elements that are inserted and populated simultaneously

- [x] Task 3: Wire completion announcements through callbacks (AC: #1, #3)
  - [x] 3.1 Modify `TaskList.svelte` — wrap the `onComplete` and `onUncomplete` callbacks to also trigger the ARIA announcement text update before calling the parent callback
  - [x] 3.2 **Timing caveat:** The `completedCount` prop is not yet updated within the synchronous callback execution (Svelte batches reactive prop updates). Use `completedCount + 1` in the onComplete wrapper and `Math.max(0, completedCount - 1)` in the onUncomplete wrapper for the announcement count

- [x] Task 4: Update AppLayout to pass all tasks (AC: #4)
  - [x] 4.1 Modify `apps/web/src/lib/components/AppLayout.svelte` — change `tasks={taskStore.openTasks}` to `tasks={taskStore.tasks}` in the TaskList props
  - [x] 4.2 Update empty state condition: change `taskStore.openTasks.length === 0 && taskStore.completedCount === 0` to `taskStore.tasks.length === 0`
  - [x] 4.3 Modify `apps/web/src/lib/components/AppLayout.test.ts` — update mock data and assertions to reflect that TaskList now receives all tasks (open + completed), not just open tasks

- [x] Task 5: Update TaskItem tests for animated completion (AC: #1, #2, #3, #5)
  - [x] 5.1 Modify `apps/web/src/lib/components/TaskItem.test.ts`
  - [x] 5.2 Test: completed task has CSS transition classes on background (verify `transition` or `duration-settle` class)
  - [x] 5.3 Test: completed checkbox has CSS transition classes on border/background
  - [x] 5.4 Test: completed title text has CSS transition on color
  - [x] 5.5 Test: `motion-reduce:transition-none` is present on transitioning elements
  - [x] 5.6 Test: existing tests still pass (no regression on static completed treatment)

- [x] Task 6: Create TaskList ARIA announcement tests (AC: #1, #3)
  - [x] 6.1 Modify `apps/web/src/lib/components/TaskList.test.ts`
  - [x] 6.2 Test: ARIA live region element exists in DOM with `role="status"` and is visually hidden
  - [x] 6.3 Test: completing a task sets announcement text containing "Task completed" and the count
  - [x] 6.4 Test: uncompleting a task sets announcement text containing "Task reopened" and the count

- [x] Task 7: Verify lint, typecheck, all tests pass (AC: all)
  - [x] 7.1 `pnpm lint` — 0 errors
  - [x] 7.2 `pnpm typecheck` — 0 errors
  - [x] 7.3 `pnpm test` — all tests pass (shared + api + web, including all new and existing tests)
  - [x] 7.4 `pnpm build` — succeeds

### Review Findings

- [x] [Review][Patch] Announcement count can be stale under rapid successive toggles [apps/web/src/lib/components/TaskList.svelte:21]
- [x] [Review][Patch] Announcement timeout is not cleaned up on component teardown [apps/web/src/lib/components/TaskList.svelte:24]

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
- `completeTask(id)`: Updates local state synchronously (`isCompleted: true, completedAt: now()`), sets `syncStatus` to `'pending'`, creates a mutation, and fires the API call. The optimistic local update happens BEFORE the async network call
- `uncompleteTask(id)`: Updates local state synchronously (`isCompleted: false, completedAt: null`), creates mutation, fires API call
- `completedCount` getter: `tasks.filter(t => t.isCompleted).length` — updates reactively when any task's `isCompleted` changes
- `openTasks` getter: `tasks.filter(t => !t.isCompleted)`
- Retry logic: 3 attempts at 5s/15s/30s with exponential backoff
- Rollback on non-retryable error
- **DO NOT modify this file** — consume it as-is from components

**`apps/web/src/lib/api.ts`** (from Story 1.3):
- `ApiResult<T>` discriminated union
- Handles 401 retry with token refresh
- **DO NOT modify**

**`apps/web/src/lib/components/TaskItem.svelte`** (from Story 2.3):
- Already renders checkbox (Bits UI `Checkbox.Root`) with `onCheckedChange` calling `onComplete`/`onUncomplete`
- Already shows completed visual treatment STATICALLY: `bg-surface-completed` background, `text-text-tertiary` title, `border-amber-500 bg-amber-500` checkbox
- Already has 44x44px touch target on checkbox
- Already has SyncIndicator dot on right edge
- Already has entry animation (`animate-[fadeIn_200ms_ease-out] motion-reduce:animate-none`)
- **MODIFY this file** — add CSS transitions to make the completion state change animated rather than instantaneous

**`apps/web/src/lib/components/TaskList.svelte`** (from Story 2.3):
- Renders open tasks via `{#each tasks as task}` → `<TaskItem>`
- Shows completed count footer with amber-400 highlight
- Props: `tasks`, `completedCount`, `onComplete`, `onUncomplete`
- **MODIFY this file** — add ARIA live region for completion announcements, wrap callbacks to trigger announcements

**`apps/web/src/lib/components/AppLayout.svelte`** (from Story 2.3):
- Wires `taskStore.completeTask` and `taskStore.uncompleteTask` to TaskList's `onComplete`/`onUncomplete`
- Currently passes `taskStore.openTasks` to TaskList — completed tasks disappear from the list immediately
- **MODIFY this file** — pass `taskStore.tasks` instead of `taskStore.openTasks` so completed tasks stay visible in the list (AC #4). Update empty state condition accordingly

**`apps/web/src/lib/components/SyncIndicator.svelte`** (from Story 2.2):
- Dot mode shows for tasks with `'pending'` sync status
- **DO NOT modify**

**`apps/web/src/lib/types/index.ts`** (from Story 2.2):
- `SyncStatus`, `MutationType`, `PendingMutation` types
- **DO NOT modify unless needed**

**`packages/shared/src/schemas/task.ts`**:
- `Task` type includes `isCompleted` (boolean), `completedAt` (nullable string ISO)
- **DO NOT modify**

### Key Implementation Detail: Transition vs Animation

This story changes the completion visual treatment from **static class swap** to **animated transition**. The current TaskItem code uses Svelte's `class:` directive to conditionally apply completed styles. The fix is to add CSS `transition` properties to the elements that change appearance, so the browser smoothly interpolates between states over 300ms.

**Current (Story 2.3 — static):**
```svelte
<div class:bg-surface-completed={task.isCompleted}>
<!-- Background jumps instantly between surface and surface-completed -->
```

**Required (Story 2.4 — animated):**
```svelte
<div
  class="transition-colors duration-settle ease-in-out motion-reduce:transition-none"
  class:bg-surface-completed={task.isCompleted}
>
<!-- Background smoothly transitions over 300ms -->
```

The same pattern applies to the checkbox (border-color/background-color) and title text (color). The key insight: Svelte's `class:` directive still toggles the classes instantly, but the CSS `transition` property makes the browser animate the change.

**Tailwind CSS v4 transition utilities used:**
- `transition-colors` — transitions `color`, `background-color`, `border-color`, `text-decoration-color`, `fill`, `stroke`
- `duration-settle` — maps to `--duration-settle: 300ms` (already in app.css theme)
- `ease-in-out` — standard easing
- `motion-reduce:transition-none` — disables transitions for prefers-reduced-motion

### Parallel Animations (AC #2)

Each TaskItem manages its own CSS transition independently. Because CSS transitions are per-element and non-blocking, rapid tapping of multiple checkboxes naturally produces parallel animations. No JavaScript animation orchestration is needed — the browser handles it.

The `onComplete`/`onUncomplete` callbacks fire synchronously on each click. The `taskStore.completeTask(id)` method updates local state synchronously, which triggers Svelte reactivity, which updates the `class:` bindings, which triggers the CSS transition. Each task item animates independently.

### ARIA Live Region Pattern

The completion announcement must use a permanently-present live region with only its text content changing. Screen readers ignore elements that are inserted and populated at the same time.

```svelte
<!-- Always in DOM, visually hidden, only text changes -->
<div role="status" aria-live="polite" class="sr-only">
  {announcementText}
</div>
```

The announcement text is set when `onComplete` or `onUncomplete` fires, then cleared after ~1s via `setTimeout`. This prevents stale text from being re-announced if the screen reader re-reads the region.

**Timing caveat:** The `completedCount` prop is reactive but Svelte batches prop updates. Within the synchronous callback wrapper, the prop value has NOT yet incremented. Use `completedCount + 1` for complete and `Math.max(0, completedCount - 1)` for uncomplete when composing the announcement string.

### UX Design Token Reference

Design tokens already configured in `apps/web/src/app.css`:

**Animation tokens:**
- `duration-settle` = 300ms — the exact duration for completion animation (UX-DR9, UX-DR21)
- `ease-in-out` — the settle timing function (UX-DR21)
- `motion-reduce:transition-none` — respects prefers-reduced-motion (UX-DR20)

**Colors for completion treatment:**
- Checkbox filled: `border-amber-500 bg-amber-500` (amber fill)
- Checkbox unfilled: `border-border-default hover:border-border-focus` (neutral border)
- Title completed: `text-text-tertiary` (#A8A29E)
- Title active: `text-text-primary` (#1C1917)
- Background completed: `bg-surface-completed` (#FEF6E8)
- Background active: `bg-surface` (inherited from parent, transparent)
- Completed count: `text-amber-400` (#FBBF24) highlight

**Typography (unchanged from Story 2.3):**
- Loud voice: `text-[length:var(--font-size-loud)] font-[number:var(--font-weight-loud)] leading-[var(--line-height-loud)]` for titles
- Quiet voice: `text-[length:var(--font-size-quiet)]` for metadata and completed count

### Completed Tasks Stay In Place (AC #4)

Completed tasks remain in the active task list in their current position. The `taskStore.openTasks` getter filters out completed tasks, but `AppLayout` passes `taskStore.openTasks` to `TaskList`. This means completed tasks will **disappear from the list** when the store updates.

**Critical implementation detail:** To keep completed tasks visible in the list (AC #4), the data passed to `TaskList` needs to include ALL non-deleted tasks (open + completed), not just open tasks. This requires changing what `AppLayout` passes to `TaskList`.

Options:
1. **Change AppLayout to pass `taskStore.tasks`** (all non-deleted tasks) instead of `taskStore.openTasks` — but `taskStore.tasks` includes all tasks, and we only want non-deleted, non-completed-relocated ones
2. **Use `taskStore.tasks.filter(t => !t.deletedAt)`** — pass all non-deleted tasks to TaskList

**Recommended approach:** Pass `taskStore.tasks` (which already excludes deleted tasks per the API GET /api/tasks filter) to `TaskList` instead of `taskStore.openTasks`. In Story 3.2 (CompletedSection), the completed tasks will be separated out. But for now, they stay in the flat list.

**AppLayout change needed:**
```svelte
<!-- Before (Story 2.3): -->
<TaskList tasks={taskStore.openTasks} ... />

<!-- After (Story 2.4): -->
<TaskList tasks={taskStore.tasks} ... />
```

**Also update the empty state condition:**
```svelte
<!-- Before: -->
{:else if taskStore.openTasks.length === 0 && taskStore.completedCount === 0}

<!-- After: -->
{:else if taskStore.tasks.length === 0}
```

**Also update the AppLayout test** to reflect the new data flow.

### Component Hierarchy (Changes from Story 2.3)

```
AppLayout.svelte (MODIFY — pass all tasks instead of openTasks)
├── ... (unchanged)
├── main content area:
│   ├── EmptyState (unchanged — shown when zero total tasks)
│   └── TaskList (MODIFY — add ARIA live region, wrap callbacks)
│       ├── TaskItem (MODIFY — add CSS transitions for completion animation)
│       │   ├── Checkbox (Bits UI — unchanged)
│       │   ├── title + metadata (add transition classes)
│       │   └── SyncIndicator mode="dot" (unchanged)
│       ├── Completed count footer (unchanged)
│       └── ARIA live region (NEW — visually hidden completion announcements)
└── ... (unchanged)
```

### File Structure (Modified Files Only)

```
apps/web/src/lib/
├── components/
│   ├── AppLayout.svelte           # MODIFY — pass taskStore.tasks instead of openTasks
│   ├── AppLayout.test.ts          # MODIFY — update mock/assertions for new data flow
│   ├── TaskItem.svelte            # MODIFY — add CSS transition classes
│   ├── TaskItem.test.ts           # MODIFY — add transition tests
│   ├── TaskList.svelte            # MODIFY — add ARIA live region, wrap callbacks
│   └── TaskList.test.ts           # MODIFY — add ARIA announcement tests
```

No new files created. No new dependencies needed.

### Anti-Patterns (DO NOT)

- **DO NOT** create a CompletedSection component — that's Story 3.2. Completed tasks stay in the main list
- **DO NOT** implement the 5-second delay + relocation of completed tasks — that's Story 3.2 (UX-DR11)
- **DO NOT** use JavaScript-driven animation (requestAnimationFrame, Web Animations API) — CSS transitions are sufficient and more performant
- **DO NOT** use `$effect()` for animation orchestration — CSS handles it natively
- **DO NOT** modify `task-store.svelte.ts` — the optimistic complete/uncomplete logic already works correctly
- **DO NOT** modify `SyncIndicator.svelte` — consume as-is
- **DO NOT** add `setTimeout` inside `$effect()` — the announcement timer is set in the callback wrapper function, not in a reactive context
- **DO NOT** use Svelte 4 stores (`writable`, `readable`) — use Svelte 5 runes only
- **DO NOT** use `export let` — use `$props()` rune for all component props
- **DO NOT** install new npm dependencies — use existing Tailwind CSS transition utilities and browser APIs only
- **DO NOT** add new `$effect()` calls — the announcement timeout is handled by `setTimeout` in callback functions, not reactive effects
- **DO NOT** re-sort tasks client-side — the API returns them in priority-weighted order, preserve that order

### Testing Patterns

**Component tests (`apps/web`):**
- Use `@testing-library/svelte` with `render()` and `screen` queries
- For TaskItem: pass data directly as props — no store mocking needed
- For TaskList: pass data directly as props — no store mocking needed
- For AppLayout: mock `taskStore` module via `vi.mock('$lib/stores/task-store.svelte', ...)`
- Test CSS transition presence by checking element classes (e.g., assert the element has `transition-colors` and `duration-settle` classes)
- Test ARIA live region by checking `role="status"` element text content after triggering callbacks
- Assert with `toEqual` not `toBe` (Svelte 5 proxy objects)
- Test environment is `happy-dom` (configured in `vitest.config.ts`)
- Use `fireEvent.click()` on the checkbox element to test completion callbacks
- Use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` for testing the announcement text clearing timeout

### Previous Story Intelligence

**From Story 2.3 (completed):**
- `TaskItem.svelte` is the primary file being enhanced. Current implementation has static completed treatment via `class:bg-surface-completed={task.isCompleted}` and ternary class expressions
- `TaskList.svelte` uses a simple `<ul>` with `{#each}` rendering. No ARIA live region currently exists
- `AppLayout.svelte` passes `taskStore.openTasks` to TaskList — this must change to `taskStore.tasks` for completed tasks to stay visible
- bits-ui was added in Story 2.3 (not pre-installed)
- All 171 tests passing (12 shared + 47 API + 112 web)
- Review findings addressed: `taskStore.loadTasks()` in `onMount`, error branch, `@keyframes fadeIn` defined, `formatRelativeDate` hardened
- Deferred: SyncIndicator dot touch target compliance (pre-existing issue)

**From Story 2.2 (completed):**
- `completeTask(id)` and `uncompleteTask(id)` are already implemented with full optimistic pattern
- Sync status tracking via `SvelteMap<string, SyncStatus>` — `getSyncStatus(taskId)` returns `'synced'` | `'pending'`
- Retry logic: 3 attempts at 5s, 15s, 30s. Non-retryable errors trigger rollback
- `SyncIndicator.svelte` shows dot when `syncStatus === 'pending'` — already integrated into TaskItem

**From Epic 1 retrospective:**
- Build/packaging was the blind spot — verify `pnpm build` succeeds
- Accessibility needs upfront attention — all components must ship with ARIA from the start
- Use `toEqual` not `toBe` for state comparisons (Svelte 5 proxy)
- `$lib` alias resolves to `apps/web/src/lib` via Vite config

### Git Intelligence

Recent commit: `ba90a2d feat: story 2.3 implemented and reviewed`

Files modified in 2.3 that are modified again by this story:
- `apps/web/src/lib/components/TaskItem.svelte` — add transition classes
- `apps/web/src/lib/components/TaskItem.test.ts` — add transition tests
- `apps/web/src/lib/components/TaskList.svelte` — add ARIA live region
- `apps/web/src/lib/components/TaskList.test.ts` — add announcement tests
- `apps/web/src/lib/components/AppLayout.svelte` — change data passed to TaskList
- `apps/web/src/lib/components/AppLayout.test.ts` — update assertions

### Null Handling Convention

API responses use explicit `null`, never omit fields. `task.completedAt` is `null` when not completed, ISO string when completed. The `isCompleted` boolean is the primary flag for visual treatment — `completedAt` is the timestamp for future temporal framing (Story 3.2).

### Import Order Convention

```typescript
// 1. External packages
import { Checkbox } from 'bits-ui'
import type { Task } from '@smart-todo/shared'

// 2. Local imports (relative)
import SyncIndicator from '$lib/components/SyncIndicator.svelte'
import { formatRelativeDate } from '$lib/utils/format'
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — acceptance criteria, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Svelte Store Architecture, optimistic UI pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Svelte Reactivity Patterns] — $effect() allowlist, component file structure, props pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#UX Spec Primitive Mapping] — Bits UI Checkbox for TaskItem completion
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR9] — completion micro-feedback: 300ms non-blocking, checkbox fill + text gray + amber tint + count increment
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR11] — completed tasks stay in place during active scanning, relocate after 5s of no interaction (deferred to Story 3.2)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR20] — prefers-reduced-motion: all animations disabled via motion-reduce prefix
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR21] — settle: 300ms ease-in-out timing for completion animation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR23] — silent feedback pattern: state changes through visual treatment only, no toasts
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR24] — secondary action: complete via checkbox tap, no button styling
- [Source: _bmad-output/implementation-artifacts/2-3-basic-task-list-and-empty-state.md] — previous story patterns, TaskItem/TaskList spec, Bits UI Checkbox integration
- [Source: _bmad-output/implementation-artifacts/2-2-optimistic-data-layer-and-sync-resilience.md] — store API, completeTask/uncompleteTask methods, sync status
- [Source: apps/web/src/lib/stores/task-store.svelte.ts] — current store implementation (completeTask at line 396, uncompleteTask at line 421)
- [Source: apps/web/src/lib/components/TaskItem.svelte] — current component to modify
- [Source: apps/web/src/lib/components/TaskList.svelte] — current component to modify
- [Source: apps/web/src/lib/components/AppLayout.svelte] — current component to modify
- [Source: apps/web/src/app.css] — design token configuration (duration-settle, colors)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TaskList announcement clearing test initially failed because `vi.advanceTimersByTime()` doesn't flush Svelte 5 microtask-based reactivity. Fixed by using `vi.advanceTimersByTimeAsync()` which properly awaits async state updates.

### Completion Notes List

- **Task 1:** Added `transition-colors duration-settle ease-in-out motion-reduce:transition-none` to TaskItem's task-item div (background), checkbox (border/background already had transition-colors, added duration-settle ease-in-out), and title text (color). Entry animation preserved unchanged.
- **Tasks 2+3:** Added permanently-present ARIA live region (`role="status"`, `aria-live="polite"`, `sr-only`) to TaskList. Created `handleComplete` and `handleUncomplete` wrapper functions that set announcement text with pre-calculated count (completedCount ± 1 to account for batched prop updates), then delegate to parent callbacks. Announcement clears after 1s via setTimeout.
- **Task 4:** Changed AppLayout to pass `taskStore.tasks` (all tasks) instead of `taskStore.openTasks` to TaskList, so completed tasks stay in place. Updated empty state condition from dual check to `taskStore.tasks.length === 0`. Updated AppLayout.test.ts with `mockTasks` mock and adjusted test data.
- **Task 5:** Added 4 new tests to TaskItem.test.ts: CSS transition classes on background, checkbox, title; motion-reduce:transition-none on all transitioning elements. All 21 TaskItem tests pass.
- **Task 6:** Added 4 new tests to TaskList.test.ts: ARIA live region existence/visibility, complete announcement text+count, uncomplete announcement text+count, announcement clearing after 1s. All 10 TaskList tests pass.
- **Task 7:** All validation gates pass — lint 0 errors, typecheck 0 errors, 123 tests pass (12 shared + 47 API + 64 web), build succeeds.

### Change Log

- 2026-04-20: Implemented Story 2.4 — Task Completion Flow. Added CSS transition animations (300ms) to TaskItem completion treatment, ARIA live region for screen reader announcements, completed tasks stay in active list, full test coverage.

### File List

- apps/web/src/lib/components/TaskItem.svelte (modified — added CSS transition classes)
- apps/web/src/lib/components/TaskList.svelte (modified — added ARIA live region, callback wrappers)
- apps/web/src/lib/components/AppLayout.svelte (modified — pass taskStore.tasks, updated empty state)
- apps/web/src/lib/components/TaskItem.test.ts (modified — 4 new transition tests)
- apps/web/src/lib/components/TaskList.test.ts (modified — 4 new ARIA announcement tests)
- apps/web/src/lib/components/AppLayout.test.ts (modified — updated mocks for new data flow)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — status update)
- _bmad-output/implementation-artifacts/2-4-task-completion-flow.md (modified — task tracking)
