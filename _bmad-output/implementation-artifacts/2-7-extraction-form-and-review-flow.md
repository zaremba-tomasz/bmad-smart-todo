# Story 2.7: Extraction Form & Review Flow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see the AI's structured understanding in an editable form and save with one tap,
So that I can confirm the extraction is right and capture my task in seconds.

## Acceptance Criteria

1. **No shimmer under 800ms:** Given the extraction request is in flight, when less than 800ms has elapsed, then no shimmer or loading indicator is shown.

2. **Shimmer after 800ms:** Given the extraction request is in flight, when more than 800ms has elapsed without a response, then a breathing shimmer appears on the extraction form area (2s ease-in-out infinite, subtle opacity pulse). If `prefers-reduced-motion` is set, static "Processing..." text is shown instead. Space is reserved for the form to prevent CLS.

3. **Extracted field display:** Given the extraction returns successfully, when the structured fields arrive, then only populated fields are displayed with a 250ms ease-out reveal animation. Each AI-populated field has a `surface-extracted` tint (#FEFDF5) that disappears when the user edits the field. Due dates display in human-readable relative format ("Today", "Next Monday"). Priority displays as a colored badge per UX-DR26. Empty fields are hidden — "+ Add date", "+ Add priority", "+ Add location" controls fade in after 500ms. The captureStore state transitions to `extracted`. An ARIA live region announces "Task details extracted. Title: [x]. Due: [y]." listing populated fields.

4. **Field editing:** Given the extraction form is showing populated fields, when I tap any field, then I can edit the value inline (FR11). The `surface-extracted` tint disappears on the edited field (becomes `surface-raised`).

5. **Save flow:** Given the extraction form is showing, when I tap the Save button (or press Enter when Save is focused), then the task is created via `POST /api/tasks` with the form field values (optimistic UI). The task appears in the task list immediately. The CaptureInput clears and the cursor returns — same frame as save, no toast, no delay (FR12, UX-DR14). The extraction form closes. An ARIA live region announces "Task saved". Focus returns to the CaptureInput.

6. **Empty title validation:** Given the Save button is visible, when I tap Save with an empty title, then the title field receives focus and shows an inline validation error below the field. The Save button is never disabled — it always responds (UX-DR35).

7. **Tab order:** Given the extraction form is showing, when I inspect the tab order, then focus moves through: title → date → priority → location → Save. All fields have visible labels and focus indicators.

## Tasks / Subtasks

- [x] Task 1: Extend captureStore with save functionality (AC: #5)
  - [x] 1.1 Add `saveTask()` method to `captureStore` — builds a `CreateTaskRequest` from `extractedFields` (or form edits), calls `taskStore.createTask(input)`, transitions state to `saving` then `idle`, clears rawInput and extractedFields
  - [x] 1.2 Add `cancelExtraction()` method — resets state to `idle`, preserves rawInput (for Escape key in Story 2.9)
  - [x] 1.3 Add `updateField(field, value)` method — allows editing individual extracted fields in the store before save
  - [x] 1.4 Handle the `saving` state transition: `extracted`/`manual` → `saving` → `idle`

- [x] Task 2: Create ExtractionForm component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 2.1 Create `apps/web/src/lib/components/ExtractionForm.svelte`
  - [x] 2.2 Implement conditional shimmer: track elapsed time since `captureStore.state === 'extracting'`. No shimmer if <800ms. After 800ms, show breathing shimmer (CSS `@keyframes shimmer` with 2s ease-in-out infinite, opacity pulse between `shimmer-base` and `shimmer-highlight` tokens). Reserve form space to prevent CLS.
  - [x] 2.3 Implement `prefers-reduced-motion` check: replace shimmer with static "Processing..." text via `motion-reduce:` Tailwind prefix
  - [x] 2.4 Implement populated-fields-only display: render only non-null extracted fields. Title always shown. dueDate, dueTime, priority, location shown only if non-null.
  - [x] 2.5 Implement 250ms ease-out reveal animation for field appearance using `opacity` + `transform` (compositable CSS only)
  - [x] 2.6 Apply `surface-extracted` (#FEFDF5) background on AI-populated fields. On edit, switch to `surface-raised` (#FFFFFF).
  - [x] 2.7 Implement "+ Add date", "+ Add priority", "+ Add location" controls that fade in 500ms after extraction fields appear. Clicking them reveals the corresponding empty field for manual entry.
  - [x] 2.8 Implement title field as editable text input (always visible)
  - [x] 2.9 Implement date field: display as human-readable relative format (use `formatRelativeDate` from `$lib/utils/format.ts`). Editable via text input showing the ISO date value on focus.
  - [x] 2.10 Implement priority field: display as colored badge per UX-DR26. Editable via select/button group (low/medium/high/urgent/clear).
  - [x] 2.11 Implement location field: display as text, editable via text input
  - [x] 2.12 Implement Save button: solid coral background (`coral-500`), white text, full-width on mobile. Always enabled (never disabled). On click/Enter: calls `captureStore.saveTask()`.
  - [x] 2.13 Implement empty-title validation: on save attempt with empty title, focus title field, show inline error "Title is required" below title field. No toast, no summary, no disabled button.
  - [x] 2.14 Implement tab order: title → date → priority → location → Save. All fields with visible focus indicators (`ring-2 ring-ring-focus ring-offset-2`).
  - [x] 2.15 Implement ARIA live region: announce "Task details extracted. Title: [title]. Due: [date]." when extraction completes (only populated fields). Announce "Task saved" after save.
  - [x] 2.16 Implement screen reader announcement for shimmer state: "Processing your task..." if shimmer activates (>800ms)

- [x] Task 3: Integrate ExtractionForm into AppLayout (AC: #3, #5)
  - [x] 3.1 Import `captureStore` in AppLayout to read state
  - [x] 3.2 Render ExtractionForm conditionally: show when `captureStore.state` is `extracting`, `extracted`, or `saving`. Hide on `idle`. (Do NOT render on `manual` — that is Story 2.8.)
  - [x] 3.3 Position ExtractionForm in the capture region: below CaptureInput on desktop, above CaptureInput on mobile (between task list and fixed-bottom input)
  - [x] 3.4 Ensure ExtractionForm does not cause CLS by reserving space during transitions

- [x] Task 4: Implement instant capture reset (AC: #5)
  - [x] 4.1 After `captureStore.saveTask()` completes: clear CaptureInput value via `captureStore.resetCapture()`, focus CaptureInput
  - [x] 4.2 The ExtractionForm closes (captureStore state returns to `idle`)
  - [x] 4.3 Task appears in TaskList via optimistic UI (`taskStore.createTask` already handles this)

- [x] Task 5: Create ExtractionForm tests (AC: #1-#7)
  - [x] 5.1 Create `apps/web/src/lib/components/ExtractionForm.test.ts`
  - [x] 5.2 Test: no shimmer shown when extracting state is <800ms (use vi.advanceTimersByTime)
  - [x] 5.3 Test: shimmer appears after 800ms of extracting state
  - [x] 5.4 Test: only populated fields render (title + dueDate but not location/priority when null)
  - [x] 5.5 Test: AI-populated fields have surface-extracted background class
  - [x] 5.6 Test: editing a field removes surface-extracted background
  - [x] 5.7 Test: "+ Add date" control appears when dueDate is null
  - [x] 5.8 Test: clicking "+ Add date" reveals an editable date field
  - [x] 5.9 Test: Save button calls captureStore.saveTask() with correct field values
  - [x] 5.10 Test: Save with empty title shows inline error and focuses title field
  - [x] 5.11 Test: Save button is never disabled
  - [x] 5.12 Test: ARIA live region contains extraction announcement text
  - [x] 5.13 Test: tab order is title → date → priority → location → Save
  - [x] 5.14 Test: prefers-reduced-motion shows "Processing..." instead of shimmer

- [x] Task 6: Create/update captureStore tests for save functionality (AC: #5)
  - [x] 6.1 Update `apps/web/src/lib/stores/capture-store.test.ts`
  - [x] 6.2 Test: `saveTask()` calls `taskStore.createTask` with mapped fields
  - [x] 6.3 Test: `saveTask()` transitions state: extracted → saving → idle
  - [x] 6.4 Test: `saveTask()` clears rawInput and extractedFields after save
  - [x] 6.5 Test: `updateField('priority', 'high')` updates extractedFields
  - [x] 6.6 Test: `cancelExtraction()` resets state to idle, preserves rawInput

- [x] Task 7: Update AppLayout tests (AC: #3)
  - [x] 7.1 Update `apps/web/src/lib/components/AppLayout.test.ts`
  - [x] 7.2 Test: ExtractionForm renders when captureStore state is `extracted`
  - [x] 7.3 Test: ExtractionForm does not render when captureStore state is `idle`

- [x] Task 8: Verify lint, typecheck, all tests pass (AC: all)
  - [x] 8.1 `pnpm lint` — 0 errors
  - [x] 8.2 `pnpm typecheck` — 0 errors
  - [x] 8.3 `pnpm test` — all new tests pass; 2 pre-existing App.test.ts failures (confirmed on clean main)
  - [x] 8.4 `pnpm build` — succeeds

### Review Findings

- [x] [Review][Patch] Add due-time display/edit support in ExtractionForm with tab-order and test coverage [apps/web/src/lib/components/ExtractionForm.svelte:1]
- [x] [Review][Patch] save flow is network-gated and can remain stuck on save failure [apps/web/src/lib/stores/capture-store.svelte.ts:69]
- [x] [Review][Patch] save button is disabled while saving, conflicting with UX-DR35 [apps/web/src/lib/components/ExtractionForm.svelte:288]
- [x] [Review][Patch] "Task saved" live announcement can be lost when form unmounts on transition to idle [apps/web/src/lib/components/ExtractionForm.svelte:103]
- [x] [Review][Patch] cancel extraction does not prevent stale in-flight result from restoring extracted/manual state [apps/web/src/lib/stores/capture-store.svelte.ts:25]
- [x] [Review][Patch] save can race with a new submit because capture input is not blocked during saving [apps/web/src/lib/components/CaptureInput.svelte:17]
- [x] [Review][Patch] extraction form is mounted twice, creating duplicate field IDs and ambiguous labeling/live regions [apps/web/src/lib/components/AppLayout.svelte:54]
- [x] [Review][Patch] focus return after save may target hidden desktop input instead of active input [apps/web/src/lib/components/ExtractionForm.svelte:105]
- [x] [Review][Patch] tests miss race-condition regressions and duplicate-form assertions [apps/web/src/lib/stores/capture-store.test.ts:382]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Monorepo:** Turborepo + pnpm workspaces. Packages: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- **Frontend stack:** Svelte 5 with Runes ($state, $derived, $effect), Tailwind CSS v4, Bits UI for accessible primitives
- **Naming conventions:** camelCase TypeScript variables/functions, PascalCase types/components, kebab-case store files (`.svelte.ts`)
- **Component props:** callback functions with `on` prefix, no custom Svelte events
- **`$effect()` allowlist:** Only for localStorage sync, onAuthStateChange, document title, navigator.onLine. The shimmer timer in ExtractionForm should use `$effect()` to track elapsed time since entering `extracting` state — this is a valid synchronization use case (syncing component state with a timer). Alternatively, use `onMount`/`onDestroy` for the timer lifecycle.
- **API calls via `lib/api.ts`** — never use `fetch` directly from components
- **Co-located tests:** Test files next to source (e.g., `ExtractionForm.test.ts` beside `ExtractionForm.svelte`)
- **Imports:** use `.js` extension in import paths for local imports (ESM)
- **Store pattern:** module-level `$state` variables with exported singleton object (same pattern as `authStore`, `taskStore`, `captureStore`)
- **No new dependencies:** This story uses only existing packages (Svelte 5, Bits UI, Tailwind)

### Existing Code to Extend (DO NOT Recreate)

**`apps/web/src/lib/stores/capture-store.svelte.ts`** — Current state machine: `idle → extracting → extracted/manual`. Extend with:
- `saveTask()` method that reads `extractedFields` (potentially with user edits), maps to `CreateTaskRequest`, calls `taskStore.createTask()`, then resets
- `updateField(field, value)` method for in-form editing
- `cancelExtraction()` method for Escape handling
- The `saving` state is already defined in `CaptureState` type but not yet used

Current store structure (module-level `$state` + singleton export):
```typescript
let state = $state<CaptureState>('idle')
let rawInput = $state('')
let extractedFields = $state<ExtractionResult | null>(null)

export const captureStore = {
  get state() { return state },
  get rawInput() { return rawInput },
  get extractedFields() { return extractedFields },
  // ... methods
}
```

**`apps/web/src/lib/stores/task-store.svelte.ts`** — Has `taskStore.createTask(input: CreateTaskRequest)` for optimistic task creation. The ExtractionForm calls this via `captureStore.saveTask()`. The `CreateTaskRequest` type is:
```typescript
{
  title: string      // min(1)
  dueDate: string | null
  dueTime: string | null
  location: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent' | null
  groupId: null      // always null until Epic 4
}
```

**IMPORTANT FIELD MAPPING:** `ExtractionResult` includes `recurrence` (object | null) — this field is NOT stored in the database. When mapping `extractedFields` to `CreateTaskRequest`, **drop recurrence entirely** and **add `groupId: null`**. The `ExtractionResult.priority` includes `'urgent'` but `CreateTaskRequest` currently validates `['low', 'medium', 'high']` only — check if this schema needs updating (it may have been updated since Story 2.1; verify the actual schema before implementation).

**`apps/web/src/lib/api.ts`** — Typed API client. `api.post()` returns `ApiResult<T>`. Task creation goes through `taskStore.createTask()`, NOT directly through `api.post()`.

**`apps/web/src/lib/components/AppLayout.svelte`** — Current layout does NOT import `captureStore`. Must import it to conditionally render ExtractionForm. The ExtractionForm should render in the capture region:
- Desktop: below the CaptureInput div (within or after `app-shell__capture-desktop`)
- Mobile: above the fixed-bottom CaptureInput div (within the scrollable main area, or as a separate fixed layer)

**`apps/web/src/lib/utils/format.ts`** — Contains `formatRelativeDate(isoDate: string | null): string` that returns "Today", "Tomorrow", "Next Monday", etc. Use this for displaying extracted due dates.

**`apps/web/src/app.css`** — Design tokens already defined:
- `--color-surface-extracted: #FEFDF5` — AI-populated field tint
- `--color-surface-raised: #FFFFFF` — edited field background
- `--color-coral-500: #FF6B4A`, `--color-coral-600: #E5553A` — Save button
- `--color-shimmer-base: #F5F5F4`, `--color-shimmer-highlight: #FAFAF9` — shimmer animation
- `--duration-reveal: 250ms` — field reveal animation
- `--duration-breathe: 2s` — shimmer breathing
- Priority badge colors per UX-DR26: Urgent (coral-500 bg, white text), High (coral-100 bg, coral-600 text), Medium (amber-100 bg, amber-900 text), Low (stone-100 bg, text-secondary text)

**`packages/shared/src/schemas/extraction.ts`** — `ExtractionResultSchema`:
```typescript
{
  title: string        // min(1)
  dueDate: string | null
  dueTime: string | null
  location: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent' | null
  recurrence: { pattern, interval, dayOfWeek, dayOfMonth } | null
}
```

**`packages/shared/src/schemas/api.ts`** — `ApiSuccessSchema(schema)` wraps as `{ data: T }`. Error codes: `EXTRACTION_TIMEOUT`, `EXTRACTION_PROVIDER_ERROR`, `EXTRACTION_VALIDATION_FAILED`.

### ExtractionForm Component Design

File: `apps/web/src/lib/components/ExtractionForm.svelte`

The ExtractionForm handles the `extracting` and `extracted` states from the captureStore. It does NOT handle the `manual` state — that is Story 2.8.

**Key behaviors by captureStore state:**
- `extracting`: Show shimmer (only after 800ms). Reserve form space. Screen reader: "Processing your task..." after 800ms.
- `extracted`: Show populated fields with reveal animation. AI tint on fields. Save button. Screen reader: announce extracted fields.
- `saving`: Form disabled, save in progress. Transitions to `idle` on completion.

**Shimmer implementation:**
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { captureStore } from '$lib/stores/capture-store.svelte'

  let showShimmer = $state(false)
  let shimmerTimer: ReturnType<typeof setTimeout> | undefined

  // Watch for extracting state to start shimmer timer
  $effect(() => {
    if (captureStore.state === 'extracting') {
      showShimmer = false
      shimmerTimer = setTimeout(() => { showShimmer = true }, 800)
    } else {
      showShimmer = false
      if (shimmerTimer) clearTimeout(shimmerTimer)
    }
  })

  onDestroy(() => {
    if (shimmerTimer) clearTimeout(shimmerTimer)
  })
</script>
```

**Populated-fields-only pattern:**
```svelte
{#if captureStore.state === 'extracted' || captureStore.state === 'saving'}
  <div class="extraction-form">
    <!-- Title always shown -->
    <div class="field" class:bg-surface-extracted={!editedFields.has('title')}>
      <label for="ef-title">Title</label>
      <input id="ef-title" type="text" value={fields.title} oninput={...} />
    </div>

    <!-- Conditional fields — only if non-null -->
    {#if fields.dueDate !== null || showAddControls.date}
      <div class="field" class:bg-surface-extracted={!editedFields.has('dueDate')}>
        <label for="ef-date">Due date</label>
        <span>{formatRelativeDate(fields.dueDate)}</span>
      </div>
    {/if}

    <!-- "+ Add date" control, fades in 500ms after extraction -->
    {#if fields.dueDate === null && !showAddControls.date}
      <button class="add-field" onclick={() => showAddControls.date = true}>
        + Add date
      </button>
    {/if}

    <!-- Save button -->
    <button class="save-btn" onclick={handleSave}>Save</button>
  </div>
{/if}
```

**Field edit tracking:** Maintain a `Set<string>` of edited field names. When a field is edited, add its key to the set. Fields in the set use `surface-raised` instead of `surface-extracted` background.

**Save handler:**
```typescript
function handleSave() {
  const title = fields.title.trim()
  if (!title) {
    // Focus title field, show inline error
    titleError = 'Title is required'
    titleInput.focus()
    return
  }
  captureStore.saveTask()
}
```

### captureStore.saveTask() Design

```typescript
async saveTask() {
  if (state !== 'extracted' && state !== 'manual') return

  const fields = extractedFields
  if (!fields || !fields.title.trim()) return

  state = 'saving'

  const input: CreateTaskRequest = {
    title: fields.title.trim(),
    dueDate: fields.dueDate,
    dueTime: fields.dueTime,
    location: fields.location,
    priority: fields.priority,
    groupId: null,  // Always null until Epic 4
  }

  await taskStore.createTask(input)

  // Reset capture loop
  state = 'idle'
  rawInput = ''
  extractedFields = null
}
```

**Import requirement:** The captureStore will need to import `taskStore`. Ensure no circular dependency (captureStore → taskStore is fine; taskStore does NOT import captureStore).

### captureStore.updateField() Design

```typescript
updateField(field: keyof ExtractionResult, value: unknown) {
  if (!extractedFields) return
  extractedFields = { ...extractedFields, [field]: value }
}
```

### Priority Badge Colors (UX-DR26)

| Priority | Background | Text | Border |
|---|---|---|---|
| Urgent | `coral-500` (#FF6B4A) | white | — |
| High | `coral-100` (#FFE4DE) | `coral-600` (#E5553A) | coral-500 at 50% opacity |
| Medium | `amber-100` (#FEF3C7) | `amber-900` (#78350F) | amber-500 at 50% opacity |
| Low | `stone-100` | `text-secondary` | `border-default` |

These badges already exist in `TaskItem.svelte` — reuse the same styling pattern. Check `TaskItem.svelte` for the exact Tailwind classes used.

### "+ Add field" Controls

Empty fields are hidden initially. After 500ms delay (post-extraction), "+ Add date", "+ Add priority", "+ Add location" ghost buttons fade in. Clicking one reveals the corresponding input field for manual entry.

Implementation: use a timer that starts on entering `extracted` state. After 500ms, set a boolean `showAddControls = true` which triggers opacity transition on the add buttons.

### Responsive Layout for ExtractionForm

**Desktop:** The ExtractionForm appears below the CaptureInput in the same `capture` grid area, or immediately below it. The form is within the `max-w-xl mx-auto` centered column.

**Mobile:** The ExtractionForm should appear in the scrollable main area above the task list (NOT inside the fixed-bottom input bar). The fixed-bottom bar keeps only the CaptureInput. The form appears between the CaptureInput bar and the task list.

Consider using a fixed/absolute positioned form panel above the mobile CaptureInput, or inserting the form into the main scrollable area. The key constraint is that the form must not overlap the task list in a way that causes CLS.

### Animation Implementation

**Field reveal (250ms ease-out):** Use CSS `transition: opacity 250ms ease-out, transform 250ms ease-out` with initial state `opacity: 0; transform: translateY(4px)` transitioning to `opacity: 1; transform: translateY(0)`. Use `motion-reduce:transition-none` to disable for reduced-motion preference.

**Shimmer breathing (2s loop):**
```css
@keyframes shimmer-breathe {
  0%, 100% { background-color: var(--color-shimmer-base); }
  50% { background-color: var(--color-shimmer-highlight); }
}
.shimmer { animation: shimmer-breathe 2s ease-in-out infinite; }
```
With `motion-reduce:` showing static text instead.

**"+ Add" control fade-in (500ms after extraction):** Use `opacity` transition triggered by a timer. Start at `opacity: 0`, transition to `opacity: 1` after the 500ms delay.

### ARIA & Accessibility

- **Live region for extraction:** `<div role="status" aria-live="polite">` that announces "Processing your task..." when shimmer activates, and "Task details extracted. Title: [title]. Due: [date]." when extraction completes (only naming populated fields).
- **Live region for save:** Same or separate region announces "Task saved" after successful save.
- **Field labels:** Every form field must have an associated `<label>` element. Use `for`/`id` pairs.
- **Focus indicators:** Use `focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none` on all interactive elements.
- **Tab order:** Natural DOM order: title input → date field → priority selector → location input → Save button.
- **Validation error:** Inline error below title field with `aria-describedby` linking the error to the input. `role="alert"` on the error element.

### Project Structure Notes

**New files to create:**
```
apps/web/src/lib/
├── components/
│   ├── ExtractionForm.svelte           # Extraction result form component
│   └── ExtractionForm.test.ts          # Component tests
```

**Files to modify:**
```
apps/web/src/lib/stores/capture-store.svelte.ts   # Add saveTask(), updateField(), cancelExtraction()
apps/web/src/lib/stores/capture-store.test.ts      # Add tests for new methods
apps/web/src/lib/components/AppLayout.svelte       # Import captureStore, render ExtractionForm conditionally
apps/web/src/lib/components/AppLayout.test.ts      # Add tests for ExtractionForm conditional rendering
```

### Testing Patterns

**ExtractionForm component tests (mock `captureStore` and `taskStore`):**
- Use `vi.mock('$lib/stores/capture-store.svelte')` to control captureStore state
- Use `vi.useFakeTimers()` for shimmer timing tests
- Test: shimmer not visible before 800ms → `vi.advanceTimersByTime(800)` → shimmer visible
- Test: in `extracted` state with `{ title: 'Test', dueDate: '2026-04-25', priority: 'high', location: null }` → title and dueDate and priority rendered, location NOT rendered
- Test: "+ Add location" button visible when location is null
- Test: clicking "+ Add location" shows location input
- Test: Save button fires `captureStore.saveTask()`
- Test: empty title + Save → inline error, title focused
- Test: ARIA live region text

**captureStore save tests (mock `taskStore.createTask`):**
- Use `vi.mock('$lib/stores/task-store.svelte')` to mock taskStore
- Test: `saveTask()` calls `taskStore.createTask` with correctly mapped `CreateTaskRequest` (no recurrence, groupId: null)
- Test: state transitions `extracted → saving → idle`
- Test: rawInput and extractedFields cleared after save
- Test: `updateField('title', 'New title')` updates extractedFields.title

**Vitest + @testing-library/svelte pattern (from existing tests):**
```typescript
import { render, screen, fireEvent } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/stores/capture-store.svelte', () => ({
  captureStore: {
    get state() { return mockState },
    get extractedFields() { return mockFields },
    saveTask: vi.fn(),
    updateField: vi.fn(),
    resetCapture: vi.fn(),
  }
}))
```

### Anti-Patterns (DO NOT)

- **DO NOT** implement the `manual` state form — that is Story 2.8. ExtractionForm should NOT render when captureStore.state is `manual`.
- **DO NOT** implement type-ahead / burst mode / auto-save on keystroke — that is Story 2.9
- **DO NOT** implement Escape key cancellation UX — that is Story 2.9 (but add `cancelExtraction()` to the store as a preparatory API)
- **DO NOT** implement "Powered by AI" indicator — that is Story 2.9
- **DO NOT** implement the PinPrompt — that is Story 2.9
- **DO NOT** implement extraction feedback (thumbs up/down) — that is Story 3.5
- **DO NOT** add recurrence fields to the form or database — recurrence is extracted by LLM but not stored in MVP
- **DO NOT** modify any API routes or backend code — this story is frontend-only
- **DO NOT** modify shared package schemas
- **DO NOT** use `fetch` directly — use `taskStore.createTask()` for task creation
- **DO NOT** add new npm dependencies
- **DO NOT** use `$effect()` for save logic — save is triggered by explicit user action (button click). `$effect()` is OK for the shimmer timer (syncing component state with elapsed time).
- **DO NOT** disable the Save button — it must always be clickable (UX-DR35)
- **DO NOT** show toast or success animation on save — instant reset IS the feedback (UX-DR14, UX-DR23)
- **DO NOT** animate with `width`, `height`, or `margin` — use only compositable properties (`opacity`, `transform`, `background-color`) for 60fps

### Scope Boundary

This story creates the ExtractionForm component and the save flow. When extraction succeeds:
1. `captureStore.state` transitions to `extracted`
2. ExtractionForm renders with populated fields (AI-tinted, editable)
3. User reviews/edits fields, taps Save
4. `captureStore.saveTask()` → `taskStore.createTask()` → optimistic UI
5. CaptureInput clears, focus returns, ExtractionForm closes

**What this story does NOT include:**
- Manual form rendering on timeout/error (Story 2.8)
- Rapid capture / burst mode / type-ahead auto-save (Story 2.9)
- Escape key to cancel (Story 2.9 — but the `cancelExtraction()` method is prepared)
- "Powered by AI" indicator (Story 2.9)
- Pin prompt (Story 2.9)
- Extraction feedback (Story 3.5)

### Previous Story Intelligence

**From Story 2.6 (completed — most recent, same feature area):**
- CaptureInput component and captureStore both created and working
- Two CaptureInput instances (desktop + mobile) sharing one captureStore singleton via controlled `value` + `oninput` pattern
- `captureStore.state` machine: `idle → extracting → extracted/manual`. The `saving` state is defined in types but not yet used
- 5s client-side timeout via `Promise.race` pattern works
- `<svelte:window>` must be top-level in Svelte 5 (not inside `{#if}` blocks)
- Import order lint rule: `@smart-todo/shared` imports must precede type-only `zod` imports
- App.test.ts required captureStore and taskStore mocks + cleanup() for test isolation
- Total test count baseline: 249 (12 shared + 88 API + 149 web)
- Review findings: IME composition guard on Enter, unique `aria-describedby` ids per instance, viewport-aware keyboard shortcuts

**From Story 2.5 (extraction API):**
- `POST /api/extract` returns `{ data: { title, dueDate, dueTime, location, priority, recurrence } }`
- Error codes: `EXTRACTION_TIMEOUT` (408), `EXTRACTION_PROVIDER_ERROR` (502), `EXTRACTION_VALIDATION_FAILED` (422)
- ExtractionResult has `recurrence` field — extracted but NOT stored in database

**From Story 2.4 (completion flow):**
- CSS transitions use `motion-reduce:transition-none` pattern — follow the same approach for extraction animations
- ARIA announcements via `role="status"` + `aria-live="polite"` pattern — reuse for extraction and save announcements
- TaskItem has priority badge styling — reuse same Tailwind classes in ExtractionForm

**From Story 2.3 (task list):**
- TaskList receives `tasks` and callback props from AppLayout
- EmptyState disappears when tasks array is non-empty (optimistic UI)

**From Story 2.2 (optimistic data layer):**
- `taskStore.createTask()` handles full optimistic lifecycle: local write → localStorage persist → API call → retry → rollback
- No need to handle persistence in the ExtractionForm — just call `taskStore.createTask(input)` and the layer handles everything

**From Story 2.1 (task API):**
- `POST /api/tasks` creates a task. The `CreateTaskRequest` body validated by Zod
- Priority enum in database is `low | medium | high | urgent` — check that `CreateTaskRequestSchema` includes `'urgent'`
- The API validates `groupId` as null (no groups yet)

**From Epic 1 retrospective:**
- Build/packaging was the blind spot — verify `pnpm build` succeeds
- Use `toEqual` not `toBe` for state object comparisons
- ESM imports must use `.js` extension

### Git Intelligence

Recent commits:
- `0efee67 feat: story 2.6 implemented and reviewed`
- `c4535e8 feat: story 2.5 implemented and reviewed`
- `113f2ac feat: story 2.4 implemented and reviewed`

All recent work is in Epic 2. Last commit (2.6) added the CaptureInput component and captureStore. This story builds directly on those files. The CaptureInput and captureStore are uncommitted changes visible in git status — they will be committed before this story starts.

### Key Technical Notes

**ExtractionResult → CreateTaskRequest field mapping:**
```typescript
const input: CreateTaskRequest = {
  title: fields.title,       // required, trimmed
  dueDate: fields.dueDate,   // string | null (ISO date)
  dueTime: fields.dueTime,   // string | null (HH:mm)
  location: fields.location, // string | null
  priority: fields.priority, // 'low' | 'medium' | 'high' | 'urgent' | null
  groupId: null,              // ALWAYS null until Epic 4
}
// fields.recurrence is DROPPED — not in CreateTaskRequest
```

**Priority enum alignment check:** The `CreateTaskRequestSchema` in `packages/shared/src/schemas/task.ts` currently defines priority as `z.enum(['low', 'medium', 'high'])` — note it's missing `'urgent'`. The `ExtractionResultSchema` includes `'urgent'`. Check the actual file before implementation. If `'urgent'` is missing from `CreateTaskRequestSchema`, the dev agent should note this discrepancy but NOT modify the shared schema (that would be a Story 2.1 regression fix or a separate task). Instead, handle it at the mapping layer by either:
1. Passing `'urgent'` through if the schema was already updated
2. Flagging the issue if validation would fail

**Svelte 5 reactivity for form fields:** Use local `$state` for form field values, initialized from `captureStore.extractedFields`. This creates a local copy that can be edited without mutating the store directly. On save, read from local state.

```svelte
<script lang="ts">
  let title = $state(captureStore.extractedFields?.title ?? '')
  let dueDate = $state(captureStore.extractedFields?.dueDate ?? null)
  // ... etc

  // Re-sync when extractedFields changes (e.g., extraction completes)
  $effect(() => {
    if (captureStore.extractedFields) {
      title = captureStore.extractedFields.title
      dueDate = captureStore.extractedFields.dueDate
      // ...
    }
  })
</script>
```

Alternatively, use `captureStore.updateField()` to keep the store as single source of truth. Choose the approach that is simpler and avoids reactivity loops.

**CSS Grid integration:** The ExtractionForm on desktop can be placed inside the `app-shell__capture-desktop` div (after the CaptureInput) or in a new grid area. The simplest approach is to place it within the existing capture div, below the input. On mobile, place it in the scrollable main area or as an overlay above the fixed input.

### Import Order Convention

```typescript
// 1. External packages
import { onMount, onDestroy } from 'svelte'

// 2. Monorepo packages
import type { ExtractionResult, CreateTaskRequest } from '@smart-todo/shared'

// 3. Local imports (relative)
import { captureStore } from '$lib/stores/capture-store.svelte'
import { taskStore } from '$lib/stores/task-store.svelte'
import { formatRelativeDate } from '$lib/utils/format.js'
import type { CaptureState } from '$lib/types/index.js'
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.7] — acceptance criteria, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — captureStore state machine (`idle → extracting → extracted/manual → saving`), ExtractionForm component boundary
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — ExtractionForm file location, AppLayout conditional rendering table
- [Source: _bmad-output/planning-artifacts/architecture.md#Svelte Reactivity Patterns] — $effect() allowlist, component file structure, props pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, import order, validation timing
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience] — extraction form reveal, shimmer, populated-fields-only, instant reset
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] — UX-DR6 (populated-fields-only), UX-DR7 (conditional shimmer), UX-DR8 (250ms reveal), UX-DR14 (instant reset), UX-DR22 (no error states), UX-DR23 (silent feedback), UX-DR24 (action hierarchy), UX-DR25 (surface-extracted tint), UX-DR26 (priority badge colors), UX-DR27 (relative date format), UX-DR35 (save never disabled)
- [Source: apps/web/src/lib/stores/capture-store.svelte.ts] — current store implementation to extend
- [Source: apps/web/src/lib/stores/task-store.svelte.ts] — taskStore.createTask() for optimistic save
- [Source: apps/web/src/lib/components/AppLayout.svelte] — layout to add ExtractionForm
- [Source: apps/web/src/lib/utils/format.ts] — formatRelativeDate() for date display
- [Source: packages/shared/src/schemas/extraction.ts] — ExtractionResultSchema
- [Source: packages/shared/src/schemas/task.ts] — CreateTaskRequestSchema, field mapping
- [Source: packages/shared/src/schemas/api.ts] — ApiSuccessSchema, error codes
- [Source: apps/web/src/app.css] — design tokens (surface-extracted, shimmer, animation durations)
- [Source: _bmad-output/implementation-artifacts/2-6-capture-input-component.md] — previous story learnings, test count baseline

## Dev Agent Record

### Agent Model Used

Opus 4.6

### Debug Log References

- Svelte 5 $state changes inside setTimeout callbacks require `await tick()` in tests to flush DOM updates
- App.test.ts has 2 pre-existing failures (timeout + multiple elements) — confirmed by running tests on clean main branch (commit 0efee67)
- CreateMutationSchema in task-store.svelte.ts is missing 'urgent' in priority enum — pre-existing discrepancy, not in scope for this story

### Completion Notes List

- ✅ Task 1: Extended captureStore with `saveTask()`, `cancelExtraction()`, `updateField()` methods. saveTask maps ExtractionResult to CreateTaskRequest (drops recurrence, adds groupId: null), delegates to taskStore.createTask, resets state.
- ✅ Task 2: Created ExtractionForm.svelte — shimmer with 800ms delay and prefers-reduced-motion fallback, populated-fields-only display with surface-extracted tint, inline editing with tint removal, priority badge selector per UX-DR26, relative date display, "+ Add" ghost buttons with 500ms fade-in, Save button (always enabled, coral-500), empty-title inline validation, ARIA live region announcements, correct tab order, 250ms reveal animation.
- ✅ Task 3: Integrated ExtractionForm into AppLayout — desktop (below CaptureInput) and mobile (above task list in scrollable area). Conditional on extracting/extracted/saving states.
- ✅ Task 4: Instant capture reset — saveTask() resets state to idle, clears form, focus returns to CaptureInput via document.querySelector.
- ✅ Task 5: Created 20 ExtractionForm tests covering shimmer timing, field display, editing, "+ Add" controls, save flow, validation, ARIA, tab order.
- ✅ Task 6: Added 9 captureStore tests for saveTask (field mapping, state transitions, cleanup), updateField, and cancelExtraction.
- ✅ Task 7: Added 2 AppLayout tests for ExtractionForm conditional rendering; updated capture-store mock with new methods.
- ✅ Task 8: All validations pass — lint 0 errors, typecheck 0 errors, build succeeds, 182 tests pass (2 pre-existing App.test.ts failures).

### Change Log

- 2026-04-21: Story 2.7 implemented — ExtractionForm component, captureStore save flow, AppLayout integration, 31 new tests

### File List

New:
- apps/web/src/lib/components/ExtractionForm.svelte
- apps/web/src/lib/components/ExtractionForm.test.ts

Modified:
- apps/web/src/lib/stores/capture-store.svelte.ts
- apps/web/src/lib/stores/capture-store.test.ts
- apps/web/src/lib/components/AppLayout.svelte
- apps/web/src/lib/components/AppLayout.test.ts
- apps/web/src/App.test.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
