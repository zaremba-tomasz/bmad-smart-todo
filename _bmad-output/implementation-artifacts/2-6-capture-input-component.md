# Story 2.6: Capture Input Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent, responsive text input where I can type tasks naturally,
So that capturing a thought requires zero navigation and zero decisions.

## Acceptance Criteria

1. **Mobile layout:** Given I am viewing the app on mobile, when the CaptureInput renders, then it is fixed to the bottom of the viewport (position: fixed, bottom: 0) and respects `env(keyboard-inset-bottom)` for virtual keyboard offset, with JavaScript fallback via `visualViewport.resize`. It spans full width with 16px horizontal padding. The input height is at least 56px (exceeds 44px touch target minimum). The submit arrow button is right-aligned inside the input with `aria-label="Submit task"`.

2. **Desktop layout:** Given I am viewing the app on desktop, when the page loads, then the CaptureInput is positioned at the top of the content area, receives auto-focus automatically (FR7), and has max-width matching the content column.

3. **No mobile auto-focus:** Given I am on mobile, when the page loads, then the CaptureInput does NOT auto-focus (prevents virtual keyboard from appearing on load).

4. **Empty state placeholder:** Given the CaptureInput renders with no tasks in the list, when I see the placeholder text, then it shows "Call the dentist next Monday, high priority" (FR36).

5. **Keyboard shortcut:** Given I am anywhere on the page (desktop), when I press the keyboard shortcut (`/` or `Ctrl+K`), then focus moves to the CaptureInput immediately (FR6). The shortcut must not fire when focus is inside the input itself or another text-editable element.

6. **Submit flow:** Given the CaptureInput is focused, when I type natural language text and press Enter (or tap the submit arrow), then the input text persists visibly (does not clear on submit — clears on save), the captureStore state transitions from `idle` to `extracting`, and a request is sent to `POST /api/extract` with my text.

7. **Screen reader:** Given the CaptureInput has ARIA attributes, when a screen reader reads it, then it announces `aria-label="Add a task"` with the placeholder described via `aria-describedby`.

8. **Extracting state visual:** Given the CaptureInput is in the `extracting` state, when I look at the input, then the input text remains visible and the input is visually muted (reduced opacity or similar) to indicate processing.

## Tasks / Subtasks

- [x] Task 1: Create capture-store (AC: #6, #8)
  - [x] 1.1 Create `apps/web/src/lib/stores/capture-store.svelte.ts` with state machine: `idle | extracting | extracted | manual | saving`
  - [x] 1.2 Implement `rawInput` ($state), `extractedFields` ($state), and `state` ($state) reactive variables
  - [x] 1.3 Implement `submitForExtraction(text: string)` — calls `POST /api/extract` via `api.post()`, transitions state from `idle` → `extracting`, handles success (`extracted`) and all error cases (`manual`)
  - [x] 1.4 Implement `resetCapture()` — clears state back to `idle`, clears rawInput and extractedFields
  - [x] 1.5 Implement 5s client-side timeout on the extraction fetch (AbortController) — on timeout, transition to `manual`
  - [x] 1.6 Export the store as `captureStore` singleton

- [x] Task 2: Create CaptureInput component (AC: #1, #2, #3, #4, #7, #8)
  - [x] 2.1 Create `apps/web/src/lib/components/CaptureInput.svelte`
  - [x] 2.2 Implement text input with `<input type="text">` (not textarea) using input voice (16px, 400 weight)
  - [x] 2.3 Add submit arrow button inside the input container with `aria-label="Submit task"`
  - [x] 2.4 Wire `onsubmit` (Enter key) and button click to call `captureStore.submitForExtraction(text)`
  - [x] 2.5 Prevent submission when text is empty (whitespace-only)
  - [x] 2.6 Set placeholder text to "Call the dentist next Monday, high priority"
  - [x] 2.7 Set `aria-label="Add a task"` on the input and wire `aria-describedby` to a visually-hidden element containing the placeholder description
  - [x] 2.8 Apply visual muting (opacity/pointer-events) when `captureStore.state === 'extracting'`
  - [x] 2.9 Auto-focus on desktop only (detect via `matchMedia('(min-width: 768px)')` in `onMount`)
  - [x] 2.10 Virtual keyboard offset: use `env(keyboard-inset-bottom)` in CSS with JS fallback via `visualViewport.resize` event

- [x] Task 3: Wire keyboard shortcut (AC: #5)
  - [x] 3.1 Add global `keydown` listener in CaptureInput (via `svelte:window` or `onMount`) for `/` and `Ctrl+K` / `Cmd+K`
  - [x] 3.2 Guard: skip if active element is an input, textarea, or contenteditable
  - [x] 3.3 `preventDefault()` on shortcut keys to prevent typing `/` into the input
  - [x] 3.4 Focus the input element via `inputRef.focus()`

- [x] Task 4: Update AppLayout to use real CaptureInput (AC: #1, #2)
  - [x] 4.1 Remove both static placeholder divs (desktop div at lines 48-52 and mobile fixed div at lines 102-110)
  - [x] 4.2 Import and render `CaptureInput` in the desktop capture grid area (visible only on `md:` breakpoint)
  - [x] 4.3 Import and render `CaptureInput` in the mobile fixed-bottom position (visible only below `md:` breakpoint)
  - [x] 4.4 Both instances must share the same `captureStore` state (singleton store — no prop drilling needed)
  - [x] 4.5 Remove `aria-hidden="true"` from the capture areas (they are now functional)

- [x] Task 5: Create capture-store tests (AC: #6, #8)
  - [x] 5.1 Create `apps/web/src/lib/stores/capture-store.test.ts`
  - [x] 5.2 Test: initial state is `idle` with empty rawInput
  - [x] 5.3 Test: `submitForExtraction` transitions to `extracting` and calls `api.post('/api/extract', { text })`
  - [x] 5.4 Test: successful extraction response transitions to `extracted` with fields populated
  - [x] 5.5 Test: extraction error (EXTRACTION_TIMEOUT, EXTRACTION_PROVIDER_ERROR, EXTRACTION_VALIDATION_FAILED) transitions to `manual` with rawInput preserved
  - [x] 5.6 Test: 5s client-side timeout transitions to `manual`
  - [x] 5.7 Test: `resetCapture()` returns to `idle`
  - [x] 5.8 Test: empty text submission is rejected (does not call API)

- [x] Task 6: Create CaptureInput component tests (AC: #1-#8)
  - [x] 6.1 Create `apps/web/src/lib/components/CaptureInput.test.ts`
  - [x] 6.2 Test: renders input with placeholder "Call the dentist next Monday, high priority"
  - [x] 6.3 Test: input has `aria-label="Add a task"`
  - [x] 6.4 Test: submit button has `aria-label="Submit task"`
  - [x] 6.5 Test: pressing Enter with text calls `captureStore.submitForExtraction`
  - [x] 6.6 Test: pressing Enter with empty text does not submit
  - [x] 6.7 Test: input is visually muted when captureStore state is `extracting`
  - [x] 6.8 Test: keyboard shortcut `/` focuses the input (when not already in an input)
  - [x] 6.9 Test: keyboard shortcut `Ctrl+K` focuses the input

- [x] Task 7: Update AppLayout tests (AC: #1, #2)
  - [x] 7.1 Update `apps/web/src/lib/components/AppLayout.test.ts` to reflect CaptureInput replacing placeholders
  - [x] 7.2 Test: CaptureInput renders in the layout (input with correct aria-label present)
  - [x] 7.3 Remove tests for static placeholder text "Add a task…"

- [x] Task 8: Verify lint, typecheck, all tests pass (AC: all)
  - [x] 8.1 `pnpm lint` — 0 errors
  - [x] 8.2 `pnpm typecheck` — 0 errors
  - [x] 8.3 `pnpm test` — all tests pass (shared + api + web)
  - [x] 8.4 `pnpm build` — succeeds

### Review Findings

- [x] [Review][Patch] Add `env(keyboard-inset-bottom)` positioning to the mobile capture dock to satisfy AC #1 [apps/web/src/lib/components/AppLayout.svelte:103]
- [x] [Review][Patch] Make keyboard shortcut handling viewport-aware so hidden desktop instance cannot capture focus on mobile layouts [apps/web/src/lib/components/CaptureInput.svelte:26]
- [x] [Review][Patch] Ensure unique `aria-describedby` ids per `CaptureInput` instance to avoid duplicate DOM ids [apps/web/src/lib/components/CaptureInput.svelte:63]
- [x] [Review][Patch] Guard Enter submit during IME composition to prevent premature submission for composing users [apps/web/src/lib/components/CaptureInput.svelte:19]
- [x] [Review][Patch] Clear extraction timeout timer after `Promise.race` resolves to avoid timer accumulation [apps/web/src/lib/stores/capture-store.svelte.ts:31]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Monorepo:** Turborepo + pnpm workspaces. Packages: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- **Frontend stack:** Svelte 5 with Runes ($state, $derived, $effect), Tailwind CSS v4, Bits UI for accessible primitives
- **Naming conventions:** camelCase TypeScript variables/functions, PascalCase types/components, kebab-case store files (`.svelte.ts`)
- **Component props:** callback functions with `on` prefix, no custom Svelte events
- **`$effect()` allowlist:** Only for localStorage sync, onAuthStateChange, document title, navigator.onLine. The captureStore should NOT use `$effect()` — state transitions happen via explicit function calls from user actions
- **API calls via `lib/api.ts`** — never use `fetch` directly from components
- **Co-located tests:** Test files next to source (e.g., `capture-store.test.ts` beside `capture-store.svelte.ts`)
- **Imports:** use `.js` extension in import paths for local imports (ESM)
- **Store pattern:** module-level `$state` variables with exported singleton object (same pattern as `authStore` and `taskStore`)
- **No new dependencies:** This story uses only existing packages (Svelte 5, Bits UI, Tailwind)

### Existing Code to Extend (DO NOT Recreate)

**`apps/web/src/lib/api.ts`** — Typed API client. Use `api.post()` to call `/api/extract`:
```typescript
import { api } from '$lib/api'
// Returns ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code, message } }
const result = await api.post('/api/extract', { text: rawInput })
```
The API client handles Bearer token injection and 401 refresh automatically. **DO NOT** add a separate extraction client.

**`apps/web/src/lib/stores/task-store.svelte.ts`** — Has `taskStore.createTask(input: CreateTaskRequest)` for optimistic task creation. The CaptureInput does NOT call createTask directly — it submits for extraction. Task creation happens in Story 2.7 (ExtractionForm) after the user reviews extracted fields.

**`apps/web/src/lib/components/AppLayout.svelte`** — Current layout with two placeholder divs:
- Desktop placeholder (lines 48-52): `<div class="app-shell__capture-desktop hidden px-4 md:block md:px-6" aria-hidden="true">` containing static "Add a task…" text
- Mobile placeholder (lines 102-110): `<div class="fixed inset-x-0 bottom-0 ..." aria-hidden="true">` fixed at bottom
- CSS Grid with named area `capture` on desktop (`grid-template-areas: "header" "capture" "nav" "sync-banner" "main"`)
- **REPLACE** both placeholders with real CaptureInput component instances. Remove `aria-hidden="true"`.

**`apps/web/src/lib/types/index.ts`** — SPA-internal types. Add `CaptureState` type here:
```typescript
export type CaptureState = 'idle' | 'extracting' | 'extracted' | 'manual' | 'saving'
```

**`packages/shared/src/schemas/extraction.ts`** — ExtractionResultSchema and ExtractRequestSchema already exist. Use for response validation:
```typescript
import { ExtractionResultSchema } from '@smart-todo/shared'
// ExtractionResult has: title, dueDate, dueTime, location, priority, recurrence (all nullable except title)
```

**`packages/shared/src/schemas/api.ts`** — `ApiSuccessSchema(schema)` wraps as `{ data: T }`. Error codes include `EXTRACTION_TIMEOUT`, `EXTRACTION_PROVIDER_ERROR`, `EXTRACTION_VALIDATION_FAILED`.

**`apps/web/src/app.css`** — Design tokens already defined:
- Colors: `--color-surface-raised`, `--color-text-tertiary`, `--color-coral-500`, `--color-border-default`, `--color-ring-focus`
- Typography: `--font-size-input: 1rem`, `--font-weight-input: 400`, `--line-height-input: 1.5`
- Animation: `--duration-snap: 100ms`, `--duration-reveal: 250ms`

### Capture Store Design

Create `apps/web/src/lib/stores/capture-store.svelte.ts`:

```typescript
import type { z } from 'zod'
import { ExtractionResultSchema, ApiSuccessSchema } from '@smart-todo/shared'

import { api } from '$lib/api'
import type { CaptureState } from '$lib/types'

const ExtractionResponseSchema = ApiSuccessSchema(ExtractionResultSchema)
type ExtractionResult = z.infer<typeof ExtractionResultSchema>

const EXTRACTION_TIMEOUT_MS = 5_000

let state = $state<CaptureState>('idle')
let rawInput = $state('')
let extractedFields = $state<ExtractionResult | null>(null)

export const captureStore = {
  get state() { return state },
  get rawInput() { return rawInput },
  get extractedFields() { return extractedFields },

  setRawInput(text: string) { rawInput = text },

  async submitForExtraction(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    rawInput = trimmed
    state = 'extracting'
    extractedFields = null

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS)

    try {
      const result = await api.post('/api/extract', { text: trimmed }, ExtractionResponseSchema)
      clearTimeout(timeoutId)

      if (result.ok) {
        extractedFields = result.data.data
        state = 'extracted'
      } else {
        state = 'manual'
      }
    } catch {
      clearTimeout(timeoutId)
      state = 'manual'
    }
  },

  resetCapture() {
    state = 'idle'
    rawInput = ''
    extractedFields = null
  },
}
```

**5s client-side timeout:** The `api.post()` function does NOT currently support an AbortSignal. There are two approaches:
1. **Wrap the fetch with a timeout race** — `Promise.race([api.post(...), timeoutPromise])` where `timeoutPromise` resolves to a manual-form trigger after 5s
2. **Pass signal through** — If the API client accepts an options parameter with signal, pass the AbortController signal

The simplest approach is `Promise.race`. The api client's `doFetch` already catches errors, so wrapping is straightforward. **Choose the approach that requires the least modification to existing code.**

**Important:** The 5s timeout is a CLIENT-SIDE timeout. The API has its own 4.5s timeout. The client timeout catches cases where the network is slow or the API itself doesn't respond.

### CaptureInput Component Design

File: `apps/web/src/lib/components/CaptureInput.svelte`

The component renders differently based on a `position` prop:
- `position="desktop"`: Renders as a static input within the grid layout
- `position="mobile"`: Renders as a fixed-bottom input

**However**, a simpler approach (matching the current AppLayout pattern) is to render the CaptureInput once inside a wrapper that uses Tailwind responsive classes (`hidden md:block` / `md:hidden`). Both instances share the same captureStore.

**Recommended implementation pattern — single component, two render sites:**

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { captureStore } from '$lib/stores/capture-store.svelte'

  let inputRef: HTMLInputElement

  let { autofocus = false }: { autofocus?: boolean } = $props()

  function handleSubmit() {
    captureStore.submitForExtraction(inputRef.value)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  onMount(() => {
    if (autofocus) inputRef.focus()
  })
</script>
```

**Desktop instance** in AppLayout: `<CaptureInput autofocus={true} />`
**Mobile instance** in AppLayout: `<CaptureInput autofocus={false} />`

Both bind to the same captureStore singleton. Input value is controlled by the store's rawInput.

### Keyboard Shortcut Implementation

Add a global keydown listener using `<svelte:window>` in the CaptureInput component (desktop instance only), or in AppLayout:

```typescript
function handleGlobalKeydown(e: KeyboardEvent) {
  // Skip if inside editable element
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return

  if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
    e.preventDefault()
    inputRef.focus()
  }
}
```

**Place the `<svelte:window>` listener in the desktop CaptureInput instance only**, or in AppLayout with a ref to the desktop input. The mobile input should NOT capture `/` shortcuts (mobile users don't use keyboard shortcuts).

### Virtual Keyboard Handling (Mobile)

```css
/* CSS approach */
.capture-mobile {
  padding-bottom: env(safe-area-inset-bottom, 0px);
  bottom: env(keyboard-inset-bottom, 0px);
}
```

JS fallback for browsers without `keyboard-inset-bottom` support:

```typescript
onMount(() => {
  if (typeof window.visualViewport !== 'undefined') {
    const vv = window.visualViewport!
    const handleResize = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop
      container.style.transform = `translateY(-${Math.max(0, offset)}px)`
    }
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }
})
```

### AppLayout Modifications

Replace the two placeholder divs with real CaptureInput instances:

**Desktop (replaces lines 48-52):**
```svelte
<div class="app-shell__capture-desktop hidden px-4 md:block md:px-6">
  <div class="mx-auto w-full max-w-xl">
    <CaptureInput autofocus={true} />
  </div>
</div>
```

**Mobile (replaces lines 102-110):**
```svelte
<div class="capture-mobile fixed inset-x-0 bottom-0 border-t border-border-default bg-surface-raised md:hidden"
     style="padding-bottom: env(safe-area-inset-bottom, 0px);">
  <div class="mx-auto w-full max-w-xl px-4">
    <CaptureInput autofocus={false} />
  </div>
</div>
```

### Input Synchronization Between Desktop and Mobile

Both CaptureInput instances read from and write to the same `captureStore` singleton. When the user types in one instance, the other reflects it via reactive state. Since only one is visible at a time (responsive hiding), this is seamless.

**Critical:** The input value should be bound to `captureStore.rawInput` so both instances stay in sync:
```svelte
<input
  bind:this={inputRef}
  type="text"
  value={captureStore.rawInput}
  oninput={(e) => captureStore.setRawInput(e.currentTarget.value)}
  ...
/>
```

Use `value` + `oninput` (controlled pattern) rather than `bind:value` to avoid infinite reactivity loops between two instances of the same store.

### Project Structure Notes

**New files to create:**
```
apps/web/src/lib/
├── stores/
│   ├── capture-store.svelte.ts       # Capture loop state machine
│   └── capture-store.test.ts         # State machine tests
├── components/
│   ├── CaptureInput.svelte           # Natural language input component
│   └── CaptureInput.test.ts          # Component tests
```

**Files to modify:**
```
apps/web/src/lib/components/AppLayout.svelte   # Replace placeholders with CaptureInput
apps/web/src/lib/components/AppLayout.test.ts  # Update tests for real component
apps/web/src/lib/types/index.ts                # Add CaptureState type
```

### Testing Patterns

**Capture store tests (mock `api.post`):**
- Use `vi.mock('$lib/api')` to mock the api module
- Test: initial state is `{ state: 'idle', rawInput: '', extractedFields: null }`
- Test: `submitForExtraction('Buy milk')` → state becomes `extracting`, then `extracted` on success
- Test: API error → state becomes `manual`, rawInput preserved
- Test: empty/whitespace text → no API call, state stays `idle`
- Test: `resetCapture()` → state back to `idle`, rawInput cleared
- Test: timeout (mock api.post to never resolve, advance timers) → state becomes `manual`

**CaptureInput component tests (mock `captureStore`):**
- Use `vi.mock('$lib/stores/capture-store.svelte')` to mock store
- Test: renders `<input>` with correct placeholder text
- Test: `aria-label="Add a task"` present on input
- Test: submit button with `aria-label="Submit task"` present
- Test: Enter key triggers `captureStore.submitForExtraction` with input value
- Test: empty input + Enter → no submission
- Test: `captureStore.state === 'extracting'` → input has reduced opacity / disabled visual

**Vitest + @testing-library/svelte pattern (from existing tests):**
```typescript
import { render, screen, fireEvent } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock stores before importing component
vi.mock('$lib/stores/capture-store.svelte', () => ({ ... }))

// Render and query
render(CaptureInput, { props: { autofocus: false } })
const input = screen.getByLabelText('Add a task')
await fireEvent.input(input, { target: { value: 'Buy milk tomorrow' } })
await fireEvent.keyDown(input, { key: 'Enter' })
```

### Anti-Patterns (DO NOT)

- **DO NOT** create the ExtractionForm in this story — that is Story 2.7
- **DO NOT** call `taskStore.createTask()` from CaptureInput — task creation happens after extraction review in Story 2.7
- **DO NOT** clear the input on submit — it clears on SAVE (Story 2.7), not on extraction submit
- **DO NOT** add new dependencies — use existing Svelte 5, Bits UI, Tailwind
- **DO NOT** use `$effect()` for the extraction API call — use explicit function calls triggered by user submit
- **DO NOT** use `bind:value` across two CaptureInput instances — use controlled `value` + `oninput` pattern
- **DO NOT** add `textarea` — the capture input is a single-line `<input type="text">`
- **DO NOT** modify any API routes or backend code — this story is frontend-only
- **DO NOT** modify the shared package schemas
- **DO NOT** auto-focus on mobile — this triggers the virtual keyboard on page load
- **DO NOT** implement the extraction form, manual form, shimmer, or field reveal — those are Stories 2.7 and 2.8
- **DO NOT** implement rapid capture / burst mode / type-ahead — that is Story 2.9

### Scope Boundary

This story creates the CaptureInput and captureStore. When submit is pressed:
1. `captureStore.state` transitions to `extracting`
2. `POST /api/extract` is called
3. On success, `captureStore.state` → `extracted` and `extractedFields` is populated
4. On error/timeout, `captureStore.state` → `manual` and `rawInput` is preserved

**What happens AFTER extraction (the form display, field editing, save) is Story 2.7.** This story's CaptureInput simply shows the input in a muted/processing state while extracting. The form that appears with extracted fields is built in Story 2.7.

The AppLayout should check `captureStore.state` to conditionally render future components (ExtractionForm in Stories 2.7/2.8), but for NOW, the only visible change during `extracting` state is the CaptureInput's visual muting. No extraction form renders yet.

### Previous Story Intelligence

**From Story 2.5 (completed):**
- POST /api/extract endpoint exists and works
- Returns `{ data: { title, dueDate, dueTime, location, priority, recurrence } }` on success
- Returns error with codes: EXTRACTION_TIMEOUT (408), EXTRACTION_PROVIDER_ERROR (502), EXTRACTION_VALIDATION_FAILED (422)
- Rate limited at 30 req/min per user
- Test count baseline: 222 total (12 shared + 85 API + 125 web)

**From Story 2.4 (completed):**
- TaskItem completion animation works with Bits UI Checkbox
- CSS transitions use `motion-reduce:transition-none` pattern
- Completion ARIA announcements work via `role="status"` + `aria-live="polite"`

**From Story 2.3 (completed):**
- EmptyState component renders "Your task list is clear."
- TaskList renders TaskItem components with metadata
- AppLayout has the placeholder capture divs that this story replaces
- The placeholder text is "Add a task…" (with ellipsis) — test assertions reference this text

**From Story 2.2 (completed):**
- Optimistic data layer with localStorage persistence fully working
- `taskStore.createTask()` handles optimistic creation with retry
- SyncIndicator component shows per-task dots and global banner

**From Story 2.1 (completed):**
- API client (`lib/api.ts`) pattern: `api.post(path, body, schema)` returns `ApiResult<T>`
- Zod schema validation on responses
- 401 retry with token refresh

**From Epic 1 retrospective:**
- Build/packaging was the blind spot — verify `pnpm build` succeeds
- Use `toEqual` not `toBe` for state comparisons
- ESM imports must use `.js` extension

### Git Intelligence

Recent commits:
- `c4535e8 feat: story 2.5 implemented and reviewed`
- `113f2ac feat: story 2.4 implemented and reviewed`
- `ba90a2d feat: story 2.3 implemented and reviewed`
- `5b4372a feat: story 2.2 implemented and reviewed`
- `d9688f7 feat: story 2.1 implemented and reviewed`

All recent work is in Epic 2. Last commit (2.5) added API services layer. This story returns to frontend work in `apps/web/`.

### Key Technical Notes

**Svelte 5 store pattern (match existing):**
```typescript
// Module-level reactive state
let state = $state<CaptureState>('idle')

// Exported singleton with getters
export const captureStore = {
  get state() { return state },
  // methods that mutate state...
}
```

**Responsive detection for auto-focus:**
```typescript
onMount(() => {
  if (autofocus && window.matchMedia('(min-width: 768px)').matches) {
    inputRef.focus()
  }
})
```
Use `matchMedia` rather than checking a prop — the `autofocus` prop controls intent, but the actual focus should only happen on desktop viewports.

**Input 16px minimum (iOS zoom prevention):** The input uses `--font-size-input: 1rem` (16px) which prevents iOS Safari from auto-zooming on focus. This is already defined in the design tokens.

**CSS Grid area `capture`:** The AppLayout CSS already defines a `capture` grid area for desktop. The desktop CaptureInput div uses `app-shell__capture-desktop` class which maps to `grid-area: capture`.

**Two instances, one store:** Both CaptureInput instances (mobile + desktop) read from the same captureStore. Only one is visible at a time (responsive CSS hiding). The input value is kept in sync via the store. This is the same pattern used by the existing placeholder divs.

### Import Order Convention

```typescript
// 1. External packages
import { onMount } from 'svelte'
import type { z } from 'zod'

// 2. Monorepo packages
import { ExtractionResultSchema, ApiSuccessSchema } from '@smart-todo/shared'

// 3. Local imports (relative)
import { api } from '$lib/api'
import { captureStore } from '$lib/stores/capture-store.svelte'
import type { CaptureState } from '$lib/types'
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6] — acceptance criteria, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — captureStore state machine, store architecture pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — CaptureInput file location, component boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Svelte Reactivity Patterns] — $effect() allowlist, component file structure, props pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, import order
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] — UX-DR5 (responsive placement), UX-DR6 (populated-fields-only), UX-DR7 (conditional shimmer), UX-DR16 (empty state placeholder), UX-DR28/29 (responsive breakpoints)
- [Source: apps/web/src/lib/components/AppLayout.svelte] — current placeholder layout, CSS Grid areas
- [Source: apps/web/src/lib/stores/task-store.svelte.ts] — store pattern to follow (module-level $state, singleton export)
- [Source: apps/web/src/lib/api.ts] — API client interface (api.post)
- [Source: packages/shared/src/schemas/extraction.ts] — ExtractionResultSchema, ExtractRequestSchema
- [Source: packages/shared/src/schemas/api.ts] — ApiSuccessSchema, ErrorCode enum
- [Source: _bmad-output/implementation-artifacts/2-5-llm-provider-abstraction-and-extraction-api.md] — previous story test count baseline, extraction API behavior

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed `<svelte:window>` placement: Svelte 5 does not allow `<svelte:window>` inside `{#if}` blocks. Moved to top-level with guard inside handler function.
- Fixed import order lint error: `@smart-todo/shared` import must precede type-only `zod` import per import-x/order rule.
- Fixed App.test.ts pre-existing test isolation issue: Added captureStore and taskStore mocks plus cleanup() call to prevent DOM duplication between tests.

### Completion Notes List

- Created `captureStore` singleton with state machine (idle → extracting → extracted/manual) using Svelte 5 runes ($state)
- Implemented 5s client-side timeout via `Promise.race` pattern (api.post does not support AbortSignal)
- Created `CaptureInput` component with `autofocus` prop, ARIA attributes, keyboard shortcuts, and visual muting during extraction
- Keyboard shortcut (`/`, `Ctrl+K`/`Cmd+K`) bound via `<svelte:window>` with guard for editable elements
- Virtual keyboard offset handled via CSS `env(safe-area-inset-bottom)` with JS `visualViewport.resize` fallback
- Replaced both placeholder divs in AppLayout with real CaptureInput instances (desktop: autofocus=true, mobile: autofocus=false)
- Both instances share same captureStore singleton; input synced via controlled `value` + `oninput` pattern
- 12 capture-store tests, 11 CaptureInput component tests, 16 AppLayout tests (updated)
- Total test count: 249 (12 shared + 88 API + 149 web), up from 222 baseline (+27 tests)

### File List

**New files:**
- apps/web/src/lib/stores/capture-store.svelte.ts
- apps/web/src/lib/stores/capture-store.test.ts
- apps/web/src/lib/components/CaptureInput.svelte
- apps/web/src/lib/components/CaptureInput.test.ts

**Modified files:**
- apps/web/src/lib/types/index.ts (added CaptureState type)
- apps/web/src/lib/components/AppLayout.svelte (replaced placeholders with CaptureInput)
- apps/web/src/lib/components/AppLayout.test.ts (updated tests, added captureStore mock)
- apps/web/src/App.test.ts (added captureStore/taskStore mocks, cleanup for test isolation)

### Change Log

- 2026-04-21: Story 2.6 implemented — CaptureInput component and captureStore with full test coverage
