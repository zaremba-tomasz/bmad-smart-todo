# Story 2.8: Graceful Degradation & Manual Form

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to capture tasks even when the AI is unavailable,
So that extraction enhances my experience but never blocks it.

## Acceptance Criteria

1. **Client-side 5s timeout triggers manual form:** Given I submitted text for extraction, when 5 seconds pass without a response (client-side timeout), then the captureStore state transitions to `manual`. The manual form appears with the title field pre-populated with my raw input text (FR15). All other fields (due date, due time, location, priority) are empty and editable (FR16). A muted label "Add details yourself" is shown — not an error, an acknowledgment (UX-DR34). No error messages, no "something went wrong" banners, no technical information is displayed.

2. **API EXTRACTION_TIMEOUT triggers manual form:** Given the API returns `EXTRACTION_TIMEOUT` error, when the SPA receives the error response, then the same manual form behavior is triggered as the client-side 5s timeout.

3. **API error codes trigger manual form:** Given the API returns `EXTRACTION_PROVIDER_ERROR` or `EXTRACTION_VALIDATION_FAILED`, when the SPA receives the error response, then the manual form appears identically to the timeout case.

4. **Manual form save flow:** Given I am on the manual form, when I fill in fields and tap Save, then the task is saved with the same one-click action as the extraction path (FR17). The task appears in my list via optimistic UI. The input clears and cursor returns (identical to the extraction save flow).

5. **Manual form visual parity:** Given the manual form is showing, when I inspect the visual treatment, then the form looks identical to the extraction form — same fields, same layout, same Save button. The only visual differences are: (a) the "Add details yourself" muted label and (b) the absence of `surface-extracted` tint on fields (all fields use `surface-raised` since no field was AI-populated).

6. **Partial extraction is NOT manual:** Given the extraction returns a partial result (title + date but no priority, no location), when the form renders, then only the populated fields are shown (title and date). No "Add details yourself" label is shown (partial extraction is a success, not a fallback). "+ Add priority", "+ Add location" controls fade in after 500ms.

7. **Empty title validation on manual form:** Given I am on the manual form and I clear the pre-populated title, when I tap Save, then the title field receives focus and shows an inline validation error. The Save button is never disabled (UX-DR35).

## Tasks / Subtasks

- [x] Task 1: Update captureStore to populate extractedFields on manual state entry (AC: #1, #2, #3)
  - [x] 1.1 In `submitForExtraction()`, when transitioning to `manual` state (on error, timeout, or API error response), set `extractedFields` to `{ title: rawInput, dueDate: null, dueTime: null, location: null, priority: null, recurrence: null }` instead of leaving it null
  - [x] 1.2 This enables ExtractionForm to render the manual form using the same field structure as extraction results

- [x] Task 2: Extend ExtractionForm to handle `manual` state (AC: #1, #4, #5, #6, #7)
  - [x] 2.1 Update `isExtracted` derived to include `manual` state: `captureStore.state === 'extracted' || captureStore.state === 'manual' || captureStore.state === 'saving'`
  - [x] 2.2 Add `isManual` derived: `captureStore.state === 'manual'`
  - [x] 2.3 Show "Add details yourself" muted label when `isManual` — text-secondary color, quiet voice font size, positioned above the form fields (after the form container opens, before the title field)
  - [x] 2.4 Skip `surface-extracted` tint in manual state — all fields use `surface-raised` background. Modify `fieldBg()` to return `'bg-surface-raised'` when `isManual` (regardless of `editedFields`)
  - [x] 2.5 Skip 250ms reveal animation in manual state — form appears instantly (set `revealed = true` immediately)
  - [x] 2.6 Show "+ Add" controls immediately in manual state (no 500ms delay) — since title is pre-populated and all other fields are empty, the add controls should be visible right away
  - [x] 2.7 Title field is pre-populated with rawInput (comes from `captureStore.extractedFields.title` which now equals rawInput in manual state)
  - [x] 2.8 All non-title fields are empty — show "+ Add date", "+ Add time", "+ Add priority", "+ Add location" controls immediately
  - [x] 2.9 Save flow is identical to extraction path — `handleSave()` already works for both states

- [x] Task 3: Update AppLayout to show ExtractionForm in manual state (AC: #1)
  - [x] 3.1 Update `showExtractionForm` derived in AppLayout to include `manual`: `captureStore.state === 'extracting' || captureStore.state === 'extracted' || captureStore.state === 'manual' || captureStore.state === 'saving'`

- [x] Task 4: Add `$effect` for manual state field initialization in ExtractionForm (AC: #1, #5)
  - [x] 4.1 Add an `$effect` that fires when `captureStore.state === 'manual' && captureStore.extractedFields` — similar to the existing extracted state effect but: sets `revealed = true` immediately (no delay), sets `showAddControls = true` immediately (no 500ms timer), sets all `editedFields` to empty set, no ARIA extraction announcement (since nothing was extracted)
  - [x] 4.2 ARIA announcement for manual state: use `captureStore.setAnnouncement('Add details yourself')` — acknowledges the fallback to screen readers

- [x] Task 5: Create/update ExtractionForm tests for manual state (AC: #1-#7)
  - [x] 5.1 Test: manual state renders the form with title pre-populated from rawInput
  - [x] 5.2 Test: manual state shows "Add details yourself" muted label
  - [x] 5.3 Test: manual state does NOT show "Add details yourself" label in extracted state (partial extraction)
  - [x] 5.4 Test: manual state fields use `bg-surface-raised` (NOT `bg-surface-extracted`)
  - [x] 5.5 Test: manual state shows "+ Add" controls immediately (no 500ms delay)
  - [x] 5.6 Test: manual state Save calls `captureStore.saveTask()` with correct values
  - [x] 5.7 Test: manual state Save with empty title shows inline error
  - [x] 5.8 Test: manual state form has same tab order as extracted state
  - [x] 5.9 Test: manual state does not show shimmer

- [x] Task 6: Update captureStore tests for manual state extractedFields population (AC: #1, #2, #3)
  - [x] 6.1 Test: API EXTRACTION_TIMEOUT response sets state to `manual` AND populates extractedFields with `{ title: rawInput, ... }`
  - [x] 6.2 Test: API EXTRACTION_PROVIDER_ERROR response populates extractedFields similarly
  - [x] 6.3 Test: API EXTRACTION_VALIDATION_FAILED response populates extractedFields similarly
  - [x] 6.4 Test: client-side 5s timeout populates extractedFields with rawInput as title
  - [x] 6.5 Test: network error populates extractedFields with rawInput as title
  - [x] 6.6 Test: `saveTask()` works correctly from manual state (maps fields to CreateTaskRequest)

- [x] Task 7: Update AppLayout tests (AC: #1)
  - [x] 7.1 Test: ExtractionForm renders when captureStore state is `manual`
  - [x] 7.2 Test: ExtractionForm does NOT render when captureStore state is `idle`

- [x] Task 8: Verify lint, typecheck, all tests pass (AC: all)
  - [x] 8.1 `pnpm lint` — 0 errors
  - [x] 8.2 `pnpm typecheck` — 0 errors
  - [x] 8.3 `pnpm test` — all new tests pass; 2 pre-existing App.test.ts failures (confirmed on clean main)
  - [x] 8.4 `pnpm build` — succeeds

### Review Findings

- [x] [Review][Patch] Manual-mode effect re-initializes transient form state on every edit [apps/web/src/lib/components/ExtractionForm.svelte:79]
- [x] [Review][Patch] Manual-mode ARIA announcement is retriggered during typing [apps/web/src/lib/components/ExtractionForm.svelte:94]
- [x] [Review][Patch] Manual fallback still renders through reveal-transition path instead of guaranteed instant appearance [apps/web/src/lib/components/ExtractionForm.svelte:167]
- [x] [Review][Patch] Manual fallback does not focus the title input on entry [apps/web/src/lib/components/ExtractionForm.svelte:79]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Monorepo:** Turborepo + pnpm workspaces. Packages: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- **Frontend stack:** Svelte 5 with Runes ($state, $derived, $effect), Tailwind CSS v4, Bits UI for accessible primitives
- **Naming conventions:** camelCase TypeScript variables/functions, PascalCase types/components, kebab-case store files (`.svelte.ts`)
- **Component props:** callback functions with `on` prefix, no custom Svelte events
- **`$effect()` allowlist:** Only for localStorage sync, onAuthStateChange, document title, navigator.onLine. The manual-state initialization $effect in ExtractionForm is a valid synchronization use case (syncing local component state with store state changes).
- **API calls via `lib/api.ts`** — never use `fetch` directly from components
- **Co-located tests:** Test files next to source (e.g., `ExtractionForm.test.ts` beside `ExtractionForm.svelte`)
- **Imports:** use `.js` extension in import paths for local imports (ESM)
- **Store pattern:** module-level `$state` variables with exported singleton object (same pattern as `authStore`, `taskStore`, `captureStore`)
- **No new dependencies:** This story uses only existing packages (Svelte 5, Bits UI, Tailwind)

### Existing Code to Extend (DO NOT Recreate)

**`apps/web/src/lib/stores/capture-store.svelte.ts`** — The key change is in `submitForExtraction()`. Currently, on error/timeout the code does:
```typescript
state = 'manual'
// extractedFields stays null
```

Change to:
```typescript
extractedFields = {
  title: rawInput,
  dueDate: null,
  dueTime: null,
  location: null,
  priority: null,
  recurrence: null,
}
state = 'manual'
```

There are THREE places where `state = 'manual'` is set:
1. In the `if (result.ok)` else branch (API returns error response) — line ~60
2. In the `catch` block (network error or client-side timeout) — line ~64
Both need the same extractedFields population.

**`saveTask()`** already handles `state === 'manual'`:
```typescript
if (state !== 'extracted' && state !== 'manual') return false
```
Since extractedFields will now be populated in manual state, saveTask() will work correctly without changes.

**`apps/web/src/lib/components/ExtractionForm.svelte`** — Currently:
```typescript
let isExtracted = $derived(captureStore.state === 'extracted' || captureStore.state === 'saving')
```

Extend to:
```typescript
let isManual = $derived(captureStore.state === 'manual')
let isExtracted = $derived(
  captureStore.state === 'extracted' || captureStore.state === 'manual' || captureStore.state === 'saving'
)
```

The existing `$effect` for `extracted` state (lines 50-77) initializes form fields from `captureStore.extractedFields`. We need a similar `$effect` for `manual` state that:
- Sets local form fields from `captureStore.extractedFields` (title = rawInput, everything else null)
- Sets `revealed = true` immediately (no animation delay)
- Sets `showAddControls = true` immediately (no 500ms timer)
- Resets `editedFields` and `addedFields`
- Does NOT announce extracted field details (instead announces "Add details yourself")

Key template changes:
1. Add the "Add details yourself" label conditionally:
```svelte
{#if isManual}
  <p class="text-[length:var(--font-size-quiet)] text-text-secondary">
    Add details yourself
  </p>
{/if}
```

2. Modify `fieldBg()` to skip surface-extracted in manual state:
```typescript
function fieldBg(field: string): string {
  if (isManual) return 'bg-surface-raised'
  return editedFields.has(field) ? 'bg-surface-raised' : 'bg-surface-extracted'
}
```

**`apps/web/src/lib/components/AppLayout.svelte`** — Update `showExtractionForm`:
```typescript
const showExtractionForm = $derived(
  captureStore.state === 'extracting'
  || captureStore.state === 'extracted'
  || captureStore.state === 'manual'
  || captureStore.state === 'saving',
)
```

### Critical Design Decision: Manual vs Partial Extraction

These are visually distinct states:

| Aspect | Partial Extraction (`extracted`) | Manual Fallback (`manual`) |
|---|---|---|
| captureStore.state | `extracted` | `manual` |
| extractedFields source | LLM response (some fields populated) | rawInput as title, everything else null |
| "Add details yourself" label | NOT shown | Shown |
| AI-populated field tint | `surface-extracted` on LLM-filled fields | No tint — all `surface-raised` |
| Field reveal animation | 250ms ease-out | Instant (no animation) |
| "+ Add" controls timing | 500ms delay after extraction | Immediate (no delay) |
| Save behavior | Identical | Identical |

Both states are "success" paths — the manual form is not an error state. The UX-DR22 "no error states" philosophy means the user should not perceive any failure.

### ExtractionForm $effect for Manual State

The existing `$effect` triggers on `captureStore.state === 'extracted'`. Add a separate `$effect` for `manual`:

```typescript
$effect(() => {
  if (captureStore.state === 'manual' && captureStore.extractedFields) {
    const fields = captureStore.extractedFields
    title = fields.title
    dueDate = fields.dueDate
    dueTime = fields.dueTime
    priority = fields.priority
    location = fields.location
    editedFields = new Set()
    addedFields = new Set()
    showAddControls = true  // Immediate, no 500ms delay
    titleError = ''

    revealed = true  // Instant, no animation delay

    captureStore.setAnnouncement('Add details yourself')
  }
})
```

Alternatively, you can merge this into the existing `$effect` with a condition check, but a separate effect is clearer and avoids accidentally breaking the extracted-state behavior.

### CaptureInput Behavior During Manual State

The CaptureInput is already disabled when `captureStore.state === 'extracting' || captureStore.state === 'saving'` via the `isBusy` derived. The `manual` state is NOT in `isBusy`, which is correct — the CaptureInput should remain interactive (enabled but with raw text visible) during the manual form display.

However, submitting a new extraction while the manual form is showing should work correctly since `submitForExtraction` resets state to `extracting` and clears extractedFields. No changes needed to CaptureInput.

### ARIA & Accessibility for Manual State

- **No "Processing your task..." announcement** — the manual form appears because extraction failed, so the processing announcement may have already played (if >800ms elapsed)
- **Announcement:** "Add details yourself" via `captureStore.setAnnouncement()` when entering manual state
- **Announcement on save:** "Task saved" (same as extraction path — already handled by `saveTask()`)
- **Tab order:** Same as extraction form: title → date → priority → location → Save
- **Focus management:** Focus should be placed on the title input when the manual form appears (the title is pre-populated, user may want to review/edit it before proceeding)

### Priority Badge Colors (UX-DR26) — Reuse from ExtractionForm

Already implemented in ExtractionForm.svelte:
```typescript
const priorityClasses: Record<string, string> = {
  urgent: 'bg-coral-500 text-white',
  high: 'bg-coral-100 text-coral-600 border border-coral-500/50',
  medium: 'bg-amber-100 text-amber-900 border border-amber-500/50',
  low: 'bg-shimmer-base text-text-secondary border border-border-default',
}
```

No changes needed — the priority selector in the manual form is the same component.

### Project Structure Notes

**Files to modify:**
```
apps/web/src/lib/stores/capture-store.svelte.ts   # Populate extractedFields on manual state entry
apps/web/src/lib/stores/capture-store.test.ts      # Update tests for extractedFields in manual state
apps/web/src/lib/components/ExtractionForm.svelte  # Handle manual state (label, no tint, instant display)
apps/web/src/lib/components/ExtractionForm.test.ts # Add manual state tests
apps/web/src/lib/components/AppLayout.svelte       # Add 'manual' to showExtractionForm
apps/web/src/lib/components/AppLayout.test.ts      # Add test for manual state rendering
```

**No new files to create.** This story modifies existing files only.

### Testing Patterns

**ExtractionForm manual state tests (mock `captureStore`):**

The test mock already exists in `ExtractionForm.test.ts`. Key additions:

```typescript
describe('manual state', () => {
  const manualFields = {
    title: 'Buy groceries tomorrow morning',
    dueDate: null,
    dueTime: null,
    location: null,
    priority: null,
    recurrence: null,
  }

  it('renders form with title pre-populated', () => {
    setStoreState('manual', manualFields)
    render(ExtractionForm)
    const titleInput = screen.getByLabelText('Title') as HTMLInputElement
    expect(titleInput.value).toBe('Buy groceries tomorrow morning')
  })

  it('shows "Add details yourself" muted label', () => {
    setStoreState('manual', manualFields)
    render(ExtractionForm)
    expect(screen.getByText('Add details yourself')).toBeTruthy()
  })

  it('does NOT show "Add details yourself" in extracted state', () => {
    setStoreState('extracted', partialFields)
    render(ExtractionForm)
    expect(screen.queryByText('Add details yourself')).toBeNull()
  })

  it('fields use bg-surface-raised, NOT bg-surface-extracted', () => {
    setStoreState('manual', manualFields)
    render(ExtractionForm)
    const titleInput = screen.getByLabelText('Title')
    expect(titleInput.className).toContain('bg-surface-raised')
    expect(titleInput.className).not.toContain('bg-surface-extracted')
  })
})
```

**captureStore tests — verify extractedFields populated on manual transition:**

Existing tests check `captureStore.extractedFields` is null after timeout/error. These need updating to check for the new populated object:

```typescript
it('5s client-side timeout transitions to manual with extractedFields populated', async () => {
  mockPost.mockImplementation(() => new Promise(() => {}))
  const promise = captureStore.submitForExtraction('Slow task')
  vi.advanceTimersByTime(5_000)
  await promise

  expect(captureStore.state).toEqual('manual')
  expect(captureStore.extractedFields).toEqual({
    title: 'Slow task',
    dueDate: null,
    dueTime: null,
    location: null,
    priority: null,
    recurrence: null,
  })
})
```

**IMPORTANT:** Update the existing tests that assert `extractedFields` is null after error/timeout — they should now assert it's populated with the rawInput-based object.

**Vitest + @testing-library/svelte pattern (from existing tests):**
```typescript
import { render, screen, fireEvent } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
```

### Anti-Patterns (DO NOT)

- **DO NOT** create a separate ManualForm component — the architecture decision (from the architecture doc) is that ExtractionForm handles both extraction result mode and manual fallback mode
- **DO NOT** show any error messages, error banners, or technical information in the manual form — UX-DR22 "no error states" philosophy
- **DO NOT** show the "Add details yourself" label for partial extraction results — partial extraction is a success, not a fallback
- **DO NOT** implement type-ahead / burst mode / auto-save on keystroke — that is Story 2.9
- **DO NOT** implement Escape key cancellation UX — that is Story 2.9
- **DO NOT** implement "Powered by AI" indicator — that is Story 2.9
- **DO NOT** implement the PinPrompt — that is Story 2.9
- **DO NOT** implement extraction feedback (thumbs up/down) — that is Story 3.5
- **DO NOT** implement FR15a client-side parsing (regex date extraction, priority keyword matching) — it's explicitly optional per the PRD ("implementation consideration, not hard requirement") and can be added later without breaking changes
- **DO NOT** modify any API routes or backend code — this story is frontend-only
- **DO NOT** modify shared package schemas
- **DO NOT** add new npm dependencies
- **DO NOT** disable the Save button — it must always be clickable (UX-DR35)
- **DO NOT** show toast or success animation on save — instant reset IS the feedback (UX-DR14, UX-DR23)
- **DO NOT** animate with `width`, `height`, or `margin` — use only compositable properties (`opacity`, `transform`, `background-color`) for 60fps

### Scope Boundary

This story extends ExtractionForm to handle the `manual` state from captureStore. When extraction fails/times out:
1. `captureStore.state` transitions to `manual`
2. `captureStore.extractedFields` is populated with `{ title: rawInput, ... nulls }`
3. ExtractionForm renders with title pre-populated, all other fields empty
4. "Add details yourself" muted label distinguishes from partial extraction
5. User fills any fields, taps Save
6. Same save flow as extraction path — optimistic UI, instant reset

**What this story does NOT include:**
- Client-side lightweight parsing / regex extraction (FR15a — optional, deferred)
- Rapid capture / burst mode / type-ahead auto-save (Story 2.9)
- Escape key to cancel (Story 2.9)
- "Powered by AI" indicator (Story 2.9)
- Pin prompt (Story 2.9)
- Extraction feedback (Story 3.5)

### Previous Story Intelligence

**From Story 2.7 (completed — most recent, same component):**
- ExtractionForm component created and working for `extracting`, `extracted`, `saving` states
- `$effect` for extracted state initializes local form fields from `captureStore.extractedFields`
- Field edit tracking via `Set<string>` — `editedFields` tracks which fields the user modified
- `showAddControls` boolean with 500ms timer delay for "+ Add" ghost buttons
- `revealed` boolean with 10ms timer for reveal animation
- `fieldBg()` function returns `bg-surface-extracted` or `bg-surface-raised` based on `editedFields`
- `handleSave()` validates title, syncs local state to store via `updateField()`, calls `saveTask()`
- Focus return to CaptureInput uses `document.querySelector` with viewport-aware selector
- AppLayout uses `showExtractionForm` derived that currently includes `extracting`, `extracted`, `saving`
- captureStore `saveTask()` already accepts `manual` state: `if (state !== 'extracted' && state !== 'manual') return false`
- Review findings from 2.7: fixed duplicate form rendering, save race conditions, focus management, stale in-flight handling
- Total test count baseline: 182 (2 pre-existing App.test.ts failures)
- `cancelExtraction()` increments `extractionRequestToken` to invalidate in-flight requests — manual state entry also needs this protection (already works because `submitForExtraction` checks `requestToken !== extractionRequestToken` before setting state)

**From Story 2.6 (CaptureInput):**
- CaptureInput `isBusy` derived: `captureStore.state === 'extracting' || captureStore.state === 'saving'` — does NOT include `manual`, which is correct (input should be interactive during manual form)
- Two CaptureInput instances (desktop + mobile) sharing one captureStore singleton
- CaptureInput dispatches `captureStore.submitForExtraction(text)` on Enter/submit

**From Story 2.5 (extraction API):**
- Error codes: `EXTRACTION_TIMEOUT` (408), `EXTRACTION_PROVIDER_ERROR` (502), `EXTRACTION_VALIDATION_FAILED` (422)
- captureStore `submitForExtraction` already transitions to `manual` on all three error codes AND on client-side 5s timeout AND on network errors

**From Story 2.4 (completion flow):**
- CSS transitions use `motion-reduce:transition-none` pattern — follow the same approach
- ARIA announcements via `role="status"` + `aria-live="polite"` pattern

**From Epic 1 retrospective:**
- Build/packaging was the blind spot — verify `pnpm build` succeeds
- Use `toEqual` not `toBe` for state object comparisons
- ESM imports must use `.js` extension

### Git Intelligence

Recent commits:
- `0cb9d41 feat: story 2.7 implemented and reviewed`
- `0efee67 feat: story 2.6 implemented and reviewed`
- `c4535e8 feat: story 2.5 implemented and reviewed`

Working tree is clean. Story 2.7 was the last commit. This story builds directly on the ExtractionForm and captureStore from story 2.7.

### Key Technical Notes

**The captureStore manual-state extractedFields population is the foundational change.** Once `extractedFields` is populated with `{ title: rawInput, dueDate: null, ... }` when entering manual state, most of the ExtractionForm rendering logic works automatically because it reads from `captureStore.extractedFields`. The remaining changes are cosmetic: skip AI tint, skip animation delay, show the contextual label.

**Existing captureStore tests WILL BREAK.** The following existing tests assert `extractedFields` is null after error/timeout transitions:
- `'extraction error (EXTRACTION_TIMEOUT) transitions to manual with rawInput preserved'` — currently checks `expect(captureStore.extractedFields).toBeNull()`
- `'extraction error (EXTRACTION_PROVIDER_ERROR) transitions to manual'` — same
- `'extraction error (EXTRACTION_VALIDATION_FAILED) transitions to manual'` — same
- `'5s client-side timeout transitions to manual'` — same
- `'network error transitions to manual'` — same

These must be updated to expect the populated extractedFields object instead of null.

**The ExtractionForm `$effect` conditions need careful ordering.** The existing `$effect` fires on `captureStore.state === 'extracted'`. The new manual `$effect` fires on `captureStore.state === 'manual'`. These are mutually exclusive states, so no ordering conflict. However, ensure the manual `$effect` does NOT start the reveal timer or add-controls timer (those are extracted-state behaviors).

### Import Order Convention

```typescript
// 1. External packages
import { onMount, onDestroy } from 'svelte'

// 2. Monorepo packages
import type { ExtractionResult } from '@smart-todo/shared'

// 3. Local imports (relative)
import { captureStore } from '$lib/stores/capture-store.svelte'
import { formatRelativeDate } from '$lib/utils/format.js'
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.8] — acceptance criteria, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — captureStore state machine (`idle → extracting → extracted/manual → saving`), ExtractionForm handles both extraction and manual modes
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — ExtractionForm dual-mode (extraction result + manual fallback), AppLayout conditional rendering table
- [Source: _bmad-output/planning-artifacts/architecture.md#Svelte Reactivity Patterns] — $effect() allowlist, component file structure
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 4: Graceful Degradation] — manual form flow diagram, "Add details yourself" label, trust preservation
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] — UX-DR22 (no error states), UX-DR34 (manual fallback contextual label), UX-DR35 (save never disabled), UX-DR14 (instant reset), UX-DR23 (silent feedback)
- [Source: apps/web/src/lib/stores/capture-store.svelte.ts] — current store with manual state transition points
- [Source: apps/web/src/lib/components/ExtractionForm.svelte] — current form handling extracted/saving states only
- [Source: apps/web/src/lib/components/AppLayout.svelte] — showExtractionForm derived missing 'manual'
- [Source: apps/web/src/lib/components/CaptureInput.svelte] — isBusy derived excludes 'manual' (correct)
- [Source: _bmad-output/implementation-artifacts/2-7-extraction-form-and-review-flow.md] — previous story learnings, review findings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Cursor)

### Debug Log References

None — implementation proceeded without errors.

### Completion Notes List

- captureStore: Both manual state transition points (API error branch and catch block) now populate `extractedFields` with `{ title: rawInput, dueDate: null, dueTime: null, location: null, priority: null, recurrence: null }` before setting `state = 'manual'`. This is the foundational change that enables ExtractionForm to render the manual form using the same field structure as extraction results.
- ExtractionForm: Added `isManual` derived, extended `isExtracted` to include `manual` state, modified `fieldBg()` to return `bg-surface-raised` in manual state, added "Add details yourself" muted label, added `$effect` for manual state initialization (instant reveal, immediate add controls, ARIA announcement).
- AppLayout: Added `manual` to `showExtractionForm` derived condition.
- captureStore tests: Updated 5 existing tests that previously asserted `extractedFields` is null after error/timeout to now assert the populated object. Added 1 new test for `saveTask()` from manual state.
- ExtractionForm tests: Added 9 new tests covering manual state rendering, label visibility, field backgrounds, immediate add controls, save flow, empty title validation, tab order, and shimmer absence.
- AppLayout tests: Added 1 new test for ExtractionForm rendering when captureStore state is `manual`.
- Total tests: 197 passed (up from 182 baseline). 2 pre-existing App.test.ts failures unchanged.
- All quality gates pass: lint 0 errors, typecheck 0 errors, build succeeds.

### Change Log

- 2026-04-21: Implemented Story 2.8 — Graceful Degradation & Manual Form. captureStore populates extractedFields on manual state entry; ExtractionForm handles manual state with "Add details yourself" label, no AI tint, instant reveal, immediate add controls; AppLayout includes manual in showExtractionForm. 15 tests added/updated.

### File List

- apps/web/src/lib/stores/capture-store.svelte.ts (modified)
- apps/web/src/lib/stores/capture-store.test.ts (modified)
- apps/web/src/lib/components/ExtractionForm.svelte (modified)
- apps/web/src/lib/components/ExtractionForm.test.ts (modified)
- apps/web/src/lib/components/AppLayout.svelte (modified)
- apps/web/src/lib/components/AppLayout.test.ts (modified)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)
- _bmad-output/implementation-artifacts/2-8-graceful-degradation-and-manual-form.md (modified)
