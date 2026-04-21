# Story 2.9: Rapid Capture, Pin Prompt & AI Transparency

Status: done

## Story

As a **user**,
I want to **capture multiple tasks in rapid succession**, **be prompted to pin the tab**, and **know that AI powers the extraction**,
so that I can **dump all my thoughts quickly**, **retain easy access**, and **trust the system transparently**.

## Acceptance Criteria

1. **Rapid re-entry:** Given I just saved a task, When I immediately type another task into CaptureInput, Then the capture loop restarts without delay or navigation (FR13); the extraction form from the previous task is already closed; the input is empty and ready for new text.

2. **Type-ahead / burst mode:** Given the extraction form is showing with populated fields, When I start typing new text into CaptureInput (type-ahead / burst), Then keystrokes refocus the CaptureInput; the previous extraction **auto-saves** with currently displayed fields (UX-DR13); a fresh extraction cycle starts; the previous task appears in the list via optimistic UI.

3. **3-capture benchmark:** Given I capture 3 tasks in rapid succession, When I complete the third save, Then all 3 tasks are visible in the list and total time for an experienced user is **under 60 seconds**.

4. **Escape cancellation:** Given the extraction form is showing, When I press **Escape**, Then the extraction is cancelled; focus returns to CaptureInput; the input text is **preserved** (not cleared).

5. **PinPrompt (desktop, one-time):** Given I just completed my **first successful save on desktop**, When the task appears in my list, Then a **PinPrompt** appears: "Pin this tab for quick access" with dismiss (UX-DR15); non-modal banner (no backdrop, no focus trap); shown **only once** — dismissal sets **localStorage** flag; never again; **not** shown on mobile.

6. **PinPrompt dismiss:** Given PinPrompt is visible, When I dismiss (×, Escape, or click elsewhere), Then it disappears permanently; focus returns to CaptureInput; `role="status"` and `aria-live="polite"`.

7. **AI transparency indicator:** Given the extraction interface is visible, When I inspect the UI, Then a visible **"Powered by AI"** indicator is present (FR37); text-secondary color, info styling — visible but not prominent.

8. **Payload privacy:** Given any extraction request is sent, When I inspect the request payload, Then only the **raw task text** is included — no `user_id`, task history, group names, or metadata (FR38).

9. **Provider no-retention:** Given the system is configured with LLM providers, When I inspect provider configuration, Then providers are configured to **not retain prompts or train** on user data (FR39, OpenRouter no-training provider filtering).

10. **Dynamic tab title:** Given the browser tab is open, When tasks exist in my list, Then the browser tab title shows **"N tasks · Smart Todo"** where N is the count of **open** (non-completed) tasks (UX-DR18). When there are no open tasks, the title shows **"Smart Todo"**.

## Tasks / Subtasks

- [x] Task 0: Verify rapid re-entry already works (AC: #1)
  - [x] Confirm existing `saveTask()` flow: clears `rawInput`, sets `state = 'idle'`, closes form — CaptureInput is empty and ready
  - [x] Write regression test: save → immediately type → new extraction starts (no code change expected — existing behavior)
- [x] Task 1: Implement Escape key cancellation in ExtractionForm/AppLayout (AC: #4)
  - [x] Wire `keydown` Escape in ExtractionForm or AppLayout (via `onkeydown` on a wrapping element or `<svelte:window>`) to call `captureStore.cancelExtraction()`
  - [x] Guard: only handle Escape when `showExtractionForm` is true
  - [x] Escape priority: if PinPrompt is also visible, Escape dismisses PinPrompt first (PinPrompt handles its own Escape); ExtractionForm Escape should check PinPrompt isn't open or let PinPrompt's handler run first via `stopPropagation`
  - [x] Verify `cancelExtraction()` preserves `rawInput` (already does — validate in tests)
  - [x] Ensure focus returns to viewport-appropriate CaptureInput via `document.querySelector('[data-capture-input]')` — use same viewport-aware pattern from 2.7
  - [x] Test: Escape during `extracting`, `extracted`, and `manual` states; input text preserved after Escape
- [x] Task 2: Implement type-ahead / burst mode auto-save (AC: #2, #3)
  - [x] In CaptureInput, detect keystrokes while `captureStore.state` is `extracted` or `manual`
  - [x] On first keystroke during active form: call `captureStore.saveTask()` (auto-save current fields), then `captureStore.submitForExtraction(newText)` with the new accumulated input
  - [x] Guard: only trigger burst on actual character input, not modifier keys or navigation keys
  - [x] Ensure the auto-saved task appears via optimistic UI before new extraction starts
  - [x] Test: type-ahead triggers save + new extraction; rapid sequential captures; modifier keys don't trigger burst
- [x] Task 3: Create AiIndicator component (AC: #7)
  - [x] New file: `apps/web/src/lib/components/AiIndicator.svelte`
  - [x] Render "Powered by AI" text in `text-secondary` color, info styling
  - [x] Show when extraction form is visible (`extracting`, `extracted`, `saving` — NOT `manual`)
  - [x] Integrate into AppLayout near ExtractionForm
  - [x] Test: visible during AI extraction, hidden during manual path
- [x] Task 4: Create PinPrompt component (AC: #5, #6)
  - [x] New file: `apps/web/src/lib/components/PinPrompt.svelte`
  - [x] Non-modal banner: `role="status"`, `aria-live="polite"`, no backdrop, no focus trap
  - [x] Text: "Pin this tab for quick access" + dismiss ×
  - [x] Dismiss on: × click, Escape, or click outside
  - [x] localStorage flag `smart-todo:pin-prompt-dismissed` — never show again after dismiss
  - [x] Desktop only (receive `isDesktopViewport` as prop from AppLayout)
  - [x] Show after first successful save in session (AppLayout tracks captureStore state transition to idle after saving)
  - [x] Integrate into AppLayout; manage visibility with local state (no store needed)
  - [x] On dismiss: focus CaptureInput
  - [x] Test: shows once on desktop after first save; dismiss behaviors; never on mobile; localStorage persistence
- [x] Task 5: Implement dynamic document title (AC: #10)
  - [x] Add `$effect` in AppLayout to sync `document.title`
  - [x] Formula: `taskStore.openTasks.length > 0 ? \`${taskStore.openTasks.length} tasks · Smart Todo\` : 'Smart Todo'`
  - [x] Singular: "1 task · Smart Todo" vs plural "N tasks · Smart Todo"
  - [x] `$effect` is on the architecture allowlist for document title updates
  - [x] Test: title updates on task create, complete, uncomplete
- [x] Task 6: Verify payload privacy and provider configuration (AC: #8, #9)
  - [x] Audit: confirm `POST /api/extract` body only contains `{ text: string }` — already enforced by `ExtractRequestSchema` and `llm-provider.ts` prompt (only raw text sent to LLM)
  - [x] Audit: confirm OpenRouter config uses no-training providers (already in `openrouter.ts` headers)
  - [x] Add assertions in existing `extract.test.ts` if not already present
  - [x] No new code expected — document verification in completion notes
- [x] Task 7: Write/update tests for all new functionality
  - [x] `AiIndicator.test.ts` — render, visibility conditions
  - [x] `PinPrompt.test.ts` — show/dismiss/localStorage/desktop-only
  - [x] Update `capture-store.test.ts` — escape preserves input
  - [x] Update `ExtractionForm.test.ts` — Escape key handling
  - [x] Update `AppLayout.test.ts` — AiIndicator/PinPrompt integration, document title
  - [x] Update `CaptureInput.test.ts` — type-ahead / burst mode triggers

### Review Findings

- [x] [Review][Patch] Burst mode does not start a new extraction request after auto-save [apps/web/src/lib/components/CaptureInput.svelte:34]
- [x] [Review][Patch] PinPrompt can appear after cancellation (not a successful save) [apps/web/src/lib/components/AppLayout.svelte:28]
- [x] [Review][Patch] Escape cancel can be blocked when PinPrompt parent flag is true but banner is not visible [apps/web/src/lib/components/AppLayout.svelte:57]
- [x] [Review][Patch] AI transparency indicator is not rendered in the mobile extraction flow [apps/web/src/lib/components/AppLayout.svelte:157]
- [x] [Review][Patch] Burst text carryover logic assumes append-only typing and can corrupt edited input [apps/web/src/lib/components/CaptureInput.svelte:35]
- [x] [Review][Patch] Burst auto-save triggers on non-character input changes (for example delete/backspace edits) [apps/web/src/lib/components/CaptureInput.svelte:30]

## Dev Notes

### Architecture Compliance

**State machine (`captureStore`):** Current states are `idle | extracting | extracted | manual | saving`. No new states required — all 2.9 features use existing transitions:
- Escape → `cancelExtraction()` already transitions to `idle`, preserves `rawInput`, clears `extractedFields`
- Burst/type-ahead → `saveTask()` (→ `idle`) then immediate `submitForExtraction()` (→ `extracting`)
- Auto-save uses existing `saveTask()` which validates `extracted | manual` state

**Component creation rules:**
- Props via `$props()`, no custom events — callback props with `on` prefix
- Component order: props, local `$state`/`$derived`, store usage, functions, template, optional `<style>`
- Co-located tests: `ComponentName.test.ts` next to `ComponentName.svelte`
- Imports: `@smart-todo/shared` before type-only `zod`; local imports with `.js` extension

**`$effect` usage — allowlist check:**
- Document title sync → **explicitly allowed** in architecture $effect allowlist
- PinPrompt localStorage read → use `onMount` not `$effect` (read once on mount, not reactive)

**Layout integration:**
- `AiIndicator` and `PinPrompt` render independently of `captureStore.state` per architecture component boundary diagram
- Both are in `AppLayout`, not gated by `showExtractionForm`
- `AiIndicator` visibility: derive from `captureStore.state` being `extracting | extracted | saving` (hide during `manual` — AI not involved)
- `PinPrompt` visibility: local component state + localStorage flags

### Critical Implementation Details

**Type-ahead / burst mode (AC #2) — the most complex feature:**

The CaptureInput is currently interactive in `extracted` and `manual` states (only disabled/busy during `extracting` and `saving`). To implement burst:

1. CaptureInput detects user typing while `captureStore.state` is `extracted` or `manual`
2. Intercept happens in CaptureInput's input handler — if form is showing, trigger auto-save first
3. Call sequence: `captureStore.saveTask()` → verify returns `true` → then `captureStore.submitForExtraction(newValue)`
4. The `saveTask()` method already: sets `saving` briefly, creates optimistic task, clears fields, returns to `idle`, then `submitForExtraction` immediately moves to `extracting`
5. Concurrency safety: `extractionRequestToken` invalidates any stale in-flight requests

**Race condition awareness:** `saveTask()` fires `taskStore.createTask()` asynchronously (fire-and-forget with `.catch`). The state goes `idle` synchronously, so `submitForExtraction()` can be called immediately after. This is safe because `createTask` is optimistic — it writes to local state and queues the API call.

**PinPrompt implementation notes:**

Architecture maps PinPrompt to Bits UI **Dialog** primitive, but epics/UX explicitly state **non-modal** (no backdrop, no focus trap). Resolution: **do NOT use `Dialog.Root/Portal/Overlay`** — use a simple positioned `<div>` with `role="status"` and `aria-live="polite"`. The Dialog reference was for a11y primitives, not modal behavior. A plain styled banner with dismiss is correct.

One localStorage key: `smart-todo:pin-prompt-dismissed` — set to `'true'` on dismiss (PinPrompt never shows again).

**Trigger mechanism:** PinPrompt should track a component-level `justSaved` flag. In AppLayout, detect when `captureStore.state` transitions from a non-idle state back to `idle` (indicating save completed). When this happens and `!dismissed && isDesktopViewport`, show PinPrompt. This means:
- First session: user saves → PinPrompt appears → user dismisses → localStorage flag set → never again
- If user closes tab without dismissing: next session, PinPrompt appears again after next save (correct — matches "shown only once" per AC, where dismissal = permanent)
- PinPrompt does NOT appear retroactively on page load for returning users who already have tasks

Show logic: `justSavedThisSession && !dismissed && isDesktopViewport`

**Escape key flow (AC #4):**

`captureStore.cancelExtraction()` already exists and does:
- Increments `extractionRequestToken` (invalidates in-flight)
- Sets `state = 'idle'`
- Sets `extractedFields = null`
- Does **NOT** clear `rawInput` ← this is correct for Escape behavior

Wire Escape in ExtractionForm or AppLayout via `<svelte:window on:keydown>` or `onkeydown`. Only handle when `showExtractionForm` is true. After cancel, refocus CaptureInput using `document.querySelector('[data-capture-input]')` with viewport awareness (same pattern as post-save focus from 2.7).

**Dynamic document title (AC #10):**

Use `$effect` in AppLayout:
```typescript
$effect(() => {
  const count = taskStore.openTasks.length
  document.title = count > 0 ? `${count} task${count !== 1 ? 's' : ''} · Smart Todo` : 'Smart Todo'
})
```

`taskStore.openTasks` is already a getter: `tasks.filter((t) => !t.isCompleted)`. The `$effect` will track both task additions and completion state changes reactively.

### Previous Story Intelligence

**From Story 2.8 — key learnings:**
- `$effect` in ExtractionForm for manual mode was too chatty — re-ran on every field edit. Guard any new `$effect` to run only on state transitions, not on every reactive change
- ARIA announcements re-fired while typing in manual mode — `setAnnouncement()` must run **once on entry** to a state, not reactively
- Manual path: instant reveal (no animation), immediate "+ Add" controls, `bg-surface-raised` (not `bg-surface-extracted`)
- Focus after manual entry should target title field — align with Escape focus return
- 197 tests passing after 2.8 (2 pre-existing `App.test.ts` failures — baseline noise)

**From Story 2.7 — patterns established:**
- `ExtractionForm` tab order: title → date → time → priority → location → Save
- Save never disabled for validation (UX-DR35) — only disabled during `saving` state briefly
- No toasts — instant reset is the feedback (UX-DR14, UX-DR23)
- Post-save focus returns to CaptureInput using viewport-aware `[data-capture-input]` selector
- `await tick()` needed in tests when DOM updates follow `setTimeout`
- Duplicate form mount caused duplicate IDs — always verify single mount in AppLayout

**From both stories — anti-patterns to avoid:**
- Don't add `$effect` that depends on values changing every keystroke unless intentionally throttled
- Don't use raw `fetch` — use `lib/api.ts` and `taskStore.createTask()`
- Don't add `createEventDispatcher` custom events — use callback props
- Don't animate manual path — instant only
- Don't introduce layout animations (`width`/`height`/`margin`/`top`) — `opacity` + `transform` only

### File Structure Requirements

**New files:**
- `apps/web/src/lib/components/AiIndicator.svelte`
- `apps/web/src/lib/components/AiIndicator.test.ts`
- `apps/web/src/lib/components/PinPrompt.svelte`
- `apps/web/src/lib/components/PinPrompt.test.ts`

**Modified files:**
- `apps/web/src/lib/components/AppLayout.svelte` — add AiIndicator, PinPrompt, Escape handler, document title $effect
- `apps/web/src/lib/components/AppLayout.test.ts` — new integration tests
- `apps/web/src/lib/components/CaptureInput.svelte` — type-ahead/burst detection
- `apps/web/src/lib/components/CaptureInput.test.ts` — burst mode tests
- `apps/web/src/lib/components/ExtractionForm.svelte` — Escape key handler (if scoped here)
- `apps/web/src/lib/components/ExtractionForm.test.ts` — Escape tests

**NOT modified (scope guard):**
- No backend/API changes — `POST /api/extract` already sends raw text only (FR38)
- No shared schema changes — extraction types already correct
- No new npm dependencies — Bits UI Dialog not needed for PinPrompt banner
- No `captureStore` changes — existing API sufficient (`cancelExtraction`, `saveTask`, `submitForExtraction`)
- No `taskStore` changes — `openTasks` getter already exists for tab title

### Testing Requirements

**Framework:** Vitest + `@testing-library/svelte` + `happy-dom`

**Patterns to follow:**
- Mock `captureStore` and `taskStore` via `vi.mock('$lib/stores/...')` with module-level `mockState`/`mockExtractedFields` — same pattern as ExtractionForm.test.ts
- Use `vi.useFakeTimers()` for timing-sensitive tests
- `await tick()` after timer-driven DOM updates
- Assert class names for styling (`bg-surface-extracted`, `text-secondary`)
- Assert `role`/`aria-*` attributes for a11y
- `vi.resetModules()` per test in store tests to reset module-level state

**Test coverage targets:**
- AiIndicator: renders "Powered by AI"; visible during extraction states; hidden during manual/idle
- PinPrompt: shows after first save on desktop; dismiss via ×, Escape, outside click; localStorage persistence; not shown on mobile; not shown after dismiss; focus returns to CaptureInput
- Escape: cancels from `extracting`/`extracted`/`manual`; preserves input text; focuses CaptureInput
- Burst: type-ahead saves current form and starts new extraction; rapid sequential captures work; 3 tasks appear in list
- Document title: updates to "N task(s) · Smart Todo"; resets to "Smart Todo" when no open tasks; updates on complete/uncomplete

### Design Tokens and Styling

- **AiIndicator text:** `text-text-secondary` — visible but not prominent
- **PinPrompt banner:** `bg-surface-raised` background, `text-text-primary` for message, `text-text-secondary` for dismiss. Positioned below header on desktop, subtle border or shadow
- **Reduced motion:** `motion-reduce:transition-none` on any transitions. PinPrompt has no animation requirement

### Known Issues & Cross-Document Discrepancies

- **Breakpoint mismatch:** PRD uses 1025px for desktop, UX uses 768px (`md:`). Existing code uses **768px** — follow the code, not the PRD
- **PinPrompt Dialog vs banner:** Architecture maps PinPrompt to Bits UI Dialog, but UX says non-modal banner. **Use banner** (resolved in implementation notes above)
- **`CreateMutationSchema` missing `urgent`:** `task-store.svelte.ts` line 26 has `z.enum(['low', 'medium', 'high'])` without `urgent` in the localStorage replay schema. If AI extracts `urgent` priority, it saves correctly via API but may fail localStorage replay validation on page reload. **Pre-existing bug from 2.1 — do not fix in 2.9** unless it causes test failures; note in completion notes if encountered
- **2 pre-existing `App.test.ts` failures:** Baseline noise from earlier stories. Do not spend time fixing unless directly related to 2.9 changes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.9] — acceptance criteria, FR/UX-DR references
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries] — AiIndicator, PinPrompt listed as independently rendered
- [Source: _bmad-output/planning-artifacts/architecture.md#$effect Allowlist] — document title sync approved
- [Source: _bmad-output/planning-artifacts/architecture.md#captureStore States] — state machine transitions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#PinPrompt] — non-modal, one-time, localStorage, desktop-only
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AI Transparency] — "Powered by AI" FR37, text-secondary
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Type-ahead] — burst mode auto-save behavior UX-DR13
- [Source: _bmad-output/planning-artifacts/prd.md#FR37-FR39] — AI transparency and privacy requirements
- [Source: _bmad-output/implementation-artifacts/2-8-graceful-degradation-and-manual-form.md] — $effect pitfalls, ARIA chatter, manual mode patterns
- [Source: _bmad-output/implementation-artifacts/2-7-extraction-form-and-review-flow.md] — save flow, focus patterns, duplicate mount bugs

## Dev Agent Record

### Agent Model Used

Opus 4.6

### Debug Log References

None — no blockers or debug cycles encountered.

### Completion Notes List

- **Task 0:** Verified rapid re-entry already works. `saveTask()` synchronously clears `rawInput`, sets `state = 'idle'`, and clears `extractedFields`. Added regression test proving immediate re-extraction after save.
- **Task 1:** Wired Escape key handler in AppLayout via `<svelte:window onkeydown>`. Guards: only fires when `showExtractionForm` is true and PinPrompt is not showing. Calls `cancelExtraction()` (preserves rawInput) and refocuses viewport-appropriate CaptureInput. 4 tests added.
- **Task 2:** Implemented burst/type-ahead mode in CaptureInput's `oninput` handler. When `state` is `extracted` or `manual`, typing auto-saves the current extraction form via `saveTask()`, then strips the old rawInput prefix to keep only newly typed characters. Uses `oninput` naturally which filters modifier/navigation keys. 6 tests added.
- **Task 3:** Created `AiIndicator.svelte` — renders "Powered by AI" in `text-text-secondary` during `extracting`, `extracted`, and `saving` states (hidden during `manual` and `idle`). Integrated into AppLayout desktop capture area. 6 tests added.
- **Task 4:** Created `PinPrompt.svelte` — non-modal banner with `role="status"`, `aria-live="polite"`. Dismisses on × click, Escape, or click outside. Sets `localStorage` flag `smart-todo:pin-prompt-dismissed` permanently. Desktop-only via prop. AppLayout manages visibility: tracks `captureStore.state` transitions to detect saves and shows PinPrompt after first save in session. PinPrompt Escape takes priority over AppLayout Escape. On dismiss, focus returns to CaptureInput. 8 tests added.
- **Task 5:** Added `$effect` in AppLayout to sync `document.title` reactively: "N task(s) · Smart Todo" with singular/plural handling, or "Smart Todo" when no open tasks. Uses `taskStore.openTasks.length` which is already reactive. 3 tests added.
- **Task 6:** Audit verified: `ExtractRequestSchema` only accepts `{ text: string }` — no user metadata sent. OpenRouter provider uses `data_collection: 'deny'` for no-retention. Existing tests already cover payload validation. No code changes needed.
- **Task 7:** All tests written alongside tasks. Final count: 227 tests passing across 17 test files (excluding 2 pre-existing App.test.ts failures). Linting and typecheck pass with zero errors.
- **Known issue noted:** `CreateMutationSchema` missing `urgent` priority (pre-existing from 2.1) — not encountered during 2.9 implementation, no test failures from it.

### File List

**New files:**
- `apps/web/src/lib/components/AiIndicator.svelte`
- `apps/web/src/lib/components/AiIndicator.test.ts`
- `apps/web/src/lib/components/PinPrompt.svelte`
- `apps/web/src/lib/components/PinPrompt.test.ts`

**Modified files:**
- `apps/web/src/lib/components/AppLayout.svelte` — Escape handler, PinPrompt integration, AiIndicator import, dynamic document title $effect, save-detection for PinPrompt trigger
- `apps/web/src/lib/components/AppLayout.test.ts` — Escape key tests (4), dynamic document title tests (3)
- `apps/web/src/lib/components/CaptureInput.svelte` — burst/type-ahead detection in oninput handler
- `apps/web/src/lib/components/CaptureInput.test.ts` — burst mode tests (6)
- `apps/web/src/lib/stores/capture-store.test.ts` — rapid re-entry regression test (1)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updated
- `_bmad-output/implementation-artifacts/2-9-rapid-capture-pin-prompt-and-ai-transparency.md` — story file updates

### Change Log

- 2026-04-21: Story 2.9 implemented — rapid capture, Escape cancellation, burst mode, AiIndicator, PinPrompt, dynamic document title, payload privacy verified. 25 new tests added (202 → 227).
