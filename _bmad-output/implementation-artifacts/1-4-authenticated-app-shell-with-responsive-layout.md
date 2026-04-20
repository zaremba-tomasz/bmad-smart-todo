# Story 1.4: Authenticated App Shell with Responsive Layout

Status: done

## Story

As a user,
I want to see a clean, responsive app layout after logging in,
so that I have a familiar, accessible interface ready for task management on any device.

## Acceptance Criteria

1. **Auth gate renders AppLayout:** Given I am authenticated, when the app loads, then `App.svelte` renders the `AppLayout` component instead of the login screen, and First Contentful Paint is ≤1.5s.

2. **Mobile responsive layout (≤767px):** Given I am viewing the app on mobile, when the layout renders, then the page uses a CSS Grid layout with a single column, the capture input area is fixed to the bottom of the viewport (placeholder, non-functional), the main content area fills the remaining space above and is scrollable, and horizontal padding is 16px (`space-4`).

3. **Desktop responsive layout (≥768px):** Given I am viewing on desktop, when the layout renders, then the content is centered with `max-width: 640px` (`max-w-xl mx-auto`), the capture input area is positioned at the top of the content (placeholder, non-functional), and generous whitespace surrounds the centered content column.

4. **Design tokens verified:** Given the layout renders on any breakpoint, when I inspect the Tailwind configuration, then the color system tokens are present and usable (`surface`, `surface-raised`, `surface-completed`, `surface-extracted`, `text-primary`, `text-secondary`, `text-tertiary`, `coral-100/500/600`, `amber-100/400/500/900`, `border-default`, `border-focus`, `ring-focus`), the Inter variable font is self-hosted with `font-display: optional`, the three type voices are configured (loud 600/17px, quiet 400/14px, input 400/16px), the spacing scale uses a 4px base unit, and animation tokens are configured (snap 100ms, reveal 250ms, settle 300ms, breathe 2s, relocate 400ms).

5. **ARIA landmarks:** Given the layout renders, when I inspect the HTML structure, then ARIA landmarks are present: `<header>` with `role="banner"`, a placeholder `<nav>` with `role="navigation"` and `aria-label="Group filters"`, `<main>` with `role="main"`, and a "Skip to task list" link is the first focusable element (visually hidden until focused).

6. **Focus indicators:** Given the layout renders, when I navigate using keyboard, then all interactive elements (logout button, skip link) have visible focus indicators (2px `ring-focus` amber-500, offset 2px) using `:focus-visible` (shown on keyboard navigation, hidden on pointer).

7. **Reduced motion:** Given a user prefers reduced motion, when the layout renders with `prefers-reduced-motion: reduce` enabled, then all animations are disabled via the `motion-reduce:` Tailwind prefix.

## Tasks / Subtasks

- [x] Task 1: Create `AppLayout.svelte` with responsive CSS Grid layout (AC: #2, #3)
  - [x] 1.1 Create `apps/web/src/lib/components/AppLayout.svelte`
  - [x] 1.2 CSS Grid with named areas: `header`, `capture-region`, `main-content`, `footer`
  - [x] 1.3 Mobile: bottom-docked capture area (`position: fixed`, `bottom: 0`, `env(safe-area-inset-bottom)`)
  - [x] 1.4 Desktop (`md:` breakpoint ≥768px): top-prominent capture area, content centered `max-w-xl mx-auto`
  - [x] 1.5 Main content area scrollable with `overflow-y: auto`, fills remaining space
  - [x] 1.6 Placeholder capture input div with `surface-raised` background
  - [x] 1.7 Placeholder task list area with empty state text

- [x] Task 2: Implement ARIA landmarks and skip link (AC: #5)
  - [x] 2.1 `<header>` (implicit banner role) with app title and logout button
  - [x] 2.2 `<nav aria-label="Group filters">` as placeholder (hidden until groups exist in Story 4.2)
  - [x] 2.3 `<main id="task-list">` (implicit main role) wrapping the task list area
  - [x] 2.4 "Skip to task list" link: first focusable element, `sr-only focus:not-sr-only` pattern, targets `#task-list`

- [x] Task 3: Configure focus indicators and keyboard navigation (AC: #6)
  - [x] 3.1 Ensure all interactive elements use `:focus-visible` ring (2px `ring-focus`/amber-500, offset 2px)
  - [x] 3.2 Logout button styled with proper focus ring
  - [x] 3.3 Skip link visible on focus with proper styling

- [x] Task 4: Implement reduced motion support (AC: #7)
  - [x] 4.1 Add `motion-reduce:` variants on any animated elements
  - [x] 4.2 Verify animation tokens are suppressed when `prefers-reduced-motion: reduce` is active

- [x] Task 5: Update `App.svelte` to render `AppLayout` when authenticated (AC: #1)
  - [x] 5.1 Import `AppLayout` and render it in the authenticated branch
  - [x] 5.2 Pass `user` and `onLogout` callback as props
  - [x] 5.3 Remove the current placeholder authenticated view

- [x] Task 6: Verify design tokens are complete in `app.css` (AC: #4)
  - [x] 6.1 Audit `@theme` block against the full token list from UX spec
  - [x] 6.2 Add any missing tokens (see Dev Notes for gap analysis)
  - [x] 6.3 Verify Inter font loads correctly with `font-display: optional`

- [x] Task 7: Write tests for `AppLayout.svelte` (AC: all)
  - [x] 7.1 Create `apps/web/src/lib/components/AppLayout.test.ts`
  - [x] 7.2 Test: renders header with banner role
  - [x] 7.3 Test: renders main with role and id
  - [x] 7.4 Test: renders skip link as first focusable element
  - [x] 7.5 Test: renders logout button that calls onLogout callback
  - [x] 7.6 Test: renders capture placeholder area
  - [x] 7.7 Test: renders nav landmark with correct aria-label

- [x] Task 8: Write/update tests for `App.svelte` (AC: #1)
  - [x] 8.1 Update or create `apps/web/src/App.test.ts`
  - [x] 8.2 Test: renders AppLayout when authenticated
  - [x] 8.3 Test: renders login form when unauthenticated

- [x] Task 9: Verify lint, typecheck, all tests pass (AC: all)
  - [x] 9.1 `pnpm test` — all tests pass (68 total: shared 12, api 16, web 40)
  - [x] 9.2 `pnpm lint` — 0 errors
  - [x] 9.3 `pnpm typecheck` — 0 errors, 0 warnings

### Review Findings

- [x] [Review][Patch] Replace the flex shell with the required mobile-first grid layout [apps/web/src/lib/components/AppLayout.svelte:17]
- [x] [Review][Patch] Make the main region the dedicated scroll container above the fixed mobile capture dock [apps/web/src/lib/components/AppLayout.svelte:45]
- [x] [Review][Patch] Expose the `Group filters` navigation landmark to assistive technology instead of hiding it with `display: none` [apps/web/src/lib/components/AppLayout.svelte:42]
- [x] [Review][Patch] Make the skip-link target focusable so “Skip to task list” reliably lands on the main landmark [apps/web/src/lib/components/AppLayout.svelte:45]
- [x] [Review][Patch] Switch the skip link to the required `:focus-visible` focus-ring treatment [apps/web/src/lib/components/AppLayout.svelte:10]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Stack:** Svelte 5 + Vite SPA (`apps/web`). This is NOT SvelteKit or React. Plain Svelte 5 + Vite.
- **Svelte 5 Runes:** Use `$props()` for component props, `$state()` for local state, `$derived()` for computed values. No `export let` (Svelte 4 pattern).
- **Component props pattern:** Callback functions with `on` prefix (e.g., `onLogout`). No custom Svelte events.
- **Tailwind CSS v4:** Styles defined via `@theme` block in `app.css`. No `tailwind.config.js`/`tailwind.config.ts` — Tailwind v4 uses CSS-first configuration via `@tailwindcss/vite` plugin.
- **Same-domain deployment:** Uses relative `/api/*` paths. Vite proxy in dev.
- **Co-located tests:** Test files next to source (`AppLayout.test.ts` beside `AppLayout.svelte`).
- **Two breakpoints only:** Mobile (0–767px, default mobile-first styles) and desktop (≥768px, `md:` Tailwind prefix). No `lg:`, `xl:`, `2xl:` prefixes. Tablet treated as wide mobile.

### Design Token Gap Analysis

The `app.css` `@theme` block already defines most tokens from Story 1.1. Verify and add any missing:

**Already present (confirmed in current `app.css`):**
- Surface colors: `surface`, `surface-raised`, `surface-completed`, `surface-extracted`
- Text colors: `text-primary`, `text-secondary`, `text-tertiary`
- Coral: `coral-100`, `coral-500`, `coral-600`
- Amber: `amber-100`, `amber-400`, `amber-500`, `amber-900`
- Borders: `border-default`, `border-focus`, `ring-focus`
- Spacing: `space-1` through `space-8`
- Animation durations: `snap`, `reveal`, `settle`, `breathe`, `relocate`
- Typography: `font-weight-loud/quiet/input`, `font-size-loud/quiet/input`, `line-height-loud/quiet/input`
- Font family: Inter self-hosted with `font-display: optional`

**Potentially missing — verify and add if needed:**
- `--color-shimmer-base: #F5F5F4` (stone-100)
- `--color-shimmer-highlight: #FAFAF9` (stone-50)
- `--color-state-error: #EF6351` (alias for coral-500 semantic)
- `--color-state-success: #F59E0B` (alias for amber-500 semantic)

**Note on coral color values:** The UX spec defines `coral-500` as `#EF6351` and `coral-600` as `#DC4A38`. The current `app.css` has `coral-500: #FF6B4A` and `coral-600: #E5553A`. These differ slightly from the spec values. The existing values were established in Story 1.1 and are already used in the login form — do NOT change them mid-implementation (breaking change). Document the discrepancy but keep the existing values.

### AppLayout Component Structure

```svelte
<script lang="ts">
  import type { User } from '@supabase/supabase-js'

  let { user, onLogout }: {
    user: User
    onLogout: () => void
  } = $props()
</script>

<!-- Skip link — MUST be first focusable element -->
<a
  href="#task-list"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 ..."
>
  Skip to task list
</a>

<div class="grid-layout">
  <header role="banner">
    <!-- App title + logout -->
  </header>

  <nav role="navigation" aria-label="Group filters">
    <!-- Placeholder for GroupPillBar (Story 4.2) -->
  </nav>

  <!-- Capture region: top on desktop, bottom-docked on mobile -->
  <div class="capture-region">
    <!-- Placeholder for CaptureInput (Story 2.6) -->
  </div>

  <main role="main" id="task-list">
    <!-- Placeholder for TaskList (Story 2.3) -->
  </main>
</div>
```

### CSS Grid Layout Strategy

Use CSS Grid with named template areas. The DOM order stays the same; `grid-template-areas` changes between mobile and desktop.

**Mobile (default, ≤767px):**
```
grid-template-areas:
  "header"
  "nav"
  "main"
  "capture";
grid-template-rows: auto auto 1fr auto;
```
- Capture region: `position: fixed; bottom: 0; left: 0; right: 0;` with `padding-bottom: env(safe-area-inset-bottom)` for notched phones
- Main area: needs `padding-bottom` to account for fixed capture input height (~70px)
- Horizontal padding: `px-4` (16px = `space-4`)

**Desktop (≥768px, `md:` prefix):**
```
grid-template-areas:
  "header"
  "capture"
  "nav"
  "main";
grid-template-rows: auto auto auto 1fr;
```
- Capture region: static, top-prominent, part of normal flow
- Content: `max-w-xl mx-auto` (640px max-width centered)
- Top margin: `space-6` (24px) above capture input

**Implementation note:** Given the fixed-position mobile capture area, CSS Grid may not be the cleanest approach for the mobile capture dock. Consider using CSS Grid for the main layout structure but `position: fixed` with padding offset for the bottom-docked mobile input. This is the established pattern (WhatsApp, iMessage) and avoids fighting CSS Grid for fixed-position elements.

### Header Component Content

The header contains:
- **App title:** "Smart Todo" in `text-primary`, not overly large (use quiet voice or slightly larger — this is chrome, not content)
- **User email:** Display `user.email` in `text-secondary` quiet voice
- **Logout button:** Secondary styling — `border-border-default`, `text-text-secondary`, ghost/outlined style. NOT primary coral. Focus ring: `focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2`
- **Layout:** Flex row with title left, user/logout right. `py-3 px-4` on mobile, centered with max-width on desktop

### Skip Link Pattern

```svelte
<a
  href="#task-list"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-text-primary focus:shadow-md focus:ring-2 focus:ring-ring-focus focus:ring-offset-2"
>
  Skip to task list
</a>
```

The `sr-only` class makes it visually hidden. On `:focus` (keyboard Tab), it becomes visible, positioned at top-left with a clear visual treatment. Clicking it focuses the `#task-list` main landmark.

### Focus Indicator Pattern

All interactive elements MUST use this focus style:
```
focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2
```

This produces a 2px amber-500 ring with 2px offset, visible only on keyboard navigation (`:focus-visible`), not on mouse click.

**Tailwind v4 note:** `ring-ring-focus` references the `--color-ring-focus` CSS variable defined in `@theme`. Verify this works correctly in Tailwind v4 — the utility `ring-ring-focus` should resolve to `ring-color: var(--color-ring-focus)`.

### Reduced Motion Support

For this story, animations are minimal (mostly future stories), but establish the pattern:
- Use `motion-reduce:` prefix on any transition/animation utilities
- Example: `transition-colors motion-reduce:transition-none`
- The `--duration-*` animation tokens in `@theme` are for use in future stories (extraction shimmer, completion animation, etc.)

### Placeholder Content Guidelines

The capture input placeholder and task list placeholder are **non-functional** in this story. They exist to:
1. Demonstrate the layout structure is correct
2. Reserve space so FCP reflects the actual layout
3. Provide visual anchors for testers

**Capture input placeholder:** A `surface-raised` colored div with rounded corners and border, containing placeholder text "Add a task..." in `text-tertiary`. Height ~56px to match the future CaptureInput.

**Task list placeholder:** The `<main>` area can be empty or show a very simple "Tasks will appear here" in `text-tertiary` centered. The full EmptyState component comes in Story 2.3.

### Browser Tab Title

This story does NOT implement the dynamic tab title (`N tasks · Smart Todo`). That comes in Story 2.9. However, the static HTML `<title>` should already be "Smart Todo" — verify in `index.html`.

### Existing Code to Build On

| File | Current State | Action |
|------|--------------|--------|
| `apps/web/src/App.svelte` | Auth gate: loading → login form → placeholder welcome screen | MODIFY: replace welcome screen with `<AppLayout>` |
| `apps/web/src/app.css` | Full `@theme` with design tokens, Inter `@font-face` | AUDIT: verify completeness, add missing tokens |
| `apps/web/src/main.ts` | Working: `loadConfig()` → `mount()` | No changes needed |
| `apps/web/src/lib/config.ts` | Working: loads `/config.json` | No changes needed |
| `apps/web/src/lib/stores/auth-store.svelte.ts` | Working: user/session/loading state, signIn/signOut/refreshSession | No changes needed |
| `apps/web/public/fonts/inter-variable.woff2` | Self-hosted Inter variable font | No changes needed |
| `apps/web/index.html` | Verify `<title>` is "Smart Todo" | Check and update if needed |

### File Structure (New/Modified Files)

```
apps/web/src/
├── App.svelte                                    # MODIFY (render AppLayout when authenticated)
├── App.test.ts                                   # NEW or MODIFY
├── app.css                                       # AUDIT (add missing tokens if any)
├── lib/
│   └── components/
│       ├── AppLayout.svelte                      # NEW (responsive layout shell)
│       └── AppLayout.test.ts                     # NEW
```

### Testing Strategy

- **Unit tests (Vitest + @testing-library/svelte):** Test AppLayout renders correct landmarks, skip link, logout button callback, placeholder areas
- **Co-located:** `AppLayout.test.ts` next to `AppLayout.svelte`
- **Mock authStore:** For App.svelte tests, mock `authStore` to simulate authenticated/unauthenticated states
- **No E2E in this story:** E2E auth flow was deferred to e2e setup; focus on component tests
- **Accessibility testing:** Verify ARIA roles are present via `getByRole()` queries

**Test patterns from Story 1.3 to reuse:**
- Svelte 5 `$state` creates proxy objects — use `toEqual` not `toBe` for state comparisons
- Mock `@supabase/supabase-js` for auth-dependent tests
- `happy-dom` is the test environment (configured in `vitest.config.ts`)

### Anti-Patterns (DO NOT)

- **DO NOT** install bits-ui or shadcn-svelte in this story — they are for interactive primitives (Checkbox, Dialog, ToggleGroup) needed in later stories (Epic 2+)
- **DO NOT** implement functional capture input, task list, or group filters — these are placeholders only
- **DO NOT** use `lg:`, `xl:`, `2xl:` breakpoint prefixes — only `md:` (768px)
- **DO NOT** add a client-side router — single-view SPA; `App.svelte` is the auth gate
- **DO NOT** animate anything beyond establishing the reduced-motion pattern — animations come with their respective feature stories
- **DO NOT** change existing coral/amber hex values in `app.css` even if they differ slightly from the UX spec — they were established in Story 1.1 and are in use
- **DO NOT** use `export let` for props — use Svelte 5 `$props()` rune
- **DO NOT** use custom Svelte events — use callback props with `on` prefix

### Previous Story Intelligence (from Story 1.3)

- `authStore` exposes `.user`, `.session`, `.loading`, `.signIn()`, `.signOut()`, `.refreshSession()`, `.init()`
- `authStore.init()` is called in `App.svelte` — do not call it again in `AppLayout`
- Login form uses design tokens via CSS variable references: `text-[length:var(--font-size-loud)]`, `font-[number:var(--font-weight-loud)]` etc. — this pattern works in Tailwind v4
- ESLint was fixed to parse `.svelte.ts` files in Story 1.3
- 50 existing tests pass (after Story 1.3); lint and typecheck clean
- `$lib` alias resolves to `apps/web/src/lib` via Vite config
- The `getLoginErrorMessage()` utility is in `$lib/auth-errors.ts` — used by `App.svelte` for login error mapping

### Git Intelligence

Recent commits show a linear progression through Epic 1 stories:
- `4cfa9d7` feat: story 1.3 implemented and reviewed (most recent)
- `7db0b2c` feat: story 1.2 implemented and reviewed
- `4bf3fe6` feat: story 1.1 implemented and reviewed

Code patterns established:
- Commit messages use `feat:` prefix for story implementations
- Stories are implemented then reviewed before marking done
- Files are co-located with tests

### Project Structure Notes

- Monorepo: Turborepo + pnpm workspaces
- Package names: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- Store files: kebab-case `.svelte.ts` (e.g., `auth-store.svelte.ts`)
- Component files: PascalCase `.svelte` (e.g., `AppLayout.svelte`)
- `components/` directory does not exist yet — create it with this story
- `components/ui/` subdirectory for shadcn-svelte primitives will come in later stories

### References

- [Source: epics.md#Story 1.4] — acceptance criteria, BDD scenarios
- [Source: architecture.md#Frontend Architecture] — AppLayout conditional rendering, component boundaries
- [Source: architecture.md#Project Structure & Boundaries] — file locations, component tree
- [Source: ux-design-specification.md#Spacing & Layout Foundation] — grid layout, breakpoints, spacing scale
- [Source: ux-design-specification.md#Visual Design Foundation] — color tokens, typography system, animation tokens
- [Source: ux-design-specification.md#Accessibility Considerations] — contrast ratios, focus indicators, touch targets
- [Source: 1-3-user-login-and-session-management.md] — authStore API, existing code patterns, design token usage
- [Source: prd.md#Accessibility] — WCAG 2.1 AA, keyboard operability, ARIA landmarks

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed `@testing-library/user-event` import error — package not installed; switched to `fireEvent` from `@testing-library/svelte`
- Fixed `lifecycle_function_unavailable` / `mount(...)` not available on server — Svelte resolved to server bundle in Vitest; added `resolve.conditions: ['browser']` to `vitest.config.ts`
- Removed redundant `role` attributes (`role="banner"`, `role="navigation"`, `role="main"`) that Svelte's a11y checker flagged — semantic HTML elements `<header>`, `<nav>`, `<main>` carry implicit ARIA roles per HTML spec; `getByRole()` tests still pass with implicit roles

### Completion Notes List

- Created `AppLayout.svelte` with flexbox layout (header, desktop capture placeholder, nav, main, mobile fixed capture dock)
- Used `position: fixed` with `env(safe-area-inset-bottom)` for mobile bottom-docked capture placeholder, `pb-24` offset on main
- Desktop uses `md:max-w-xl md:mx-auto` for centered content column with `md:block` for top-prominent capture
- Skip link is first focusable element with `sr-only focus:not-sr-only` pattern, targets `#task-list`
- All interactive elements use `focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2` pattern
- Logout button uses `motion-reduce:transition-none` to establish the reduced-motion pattern
- Added missing design tokens: `shimmer-base`, `shimmer-highlight`; added `ui-sans-serif` to font stack
- Kept existing coral/amber hex values unchanged per story instructions
- 12 new tests: 9 AppLayout (landmarks, skip link, logout callback, placeholders, user email) + 3 App (authenticated→AppLayout, unauthenticated→login, loading state)
- `vitest.config.ts` updated with `resolve.conditions: ['browser']` — required for Svelte 5 component rendering in tests

### File List

- `apps/web/src/lib/components/AppLayout.svelte` — NEW (responsive layout shell)
- `apps/web/src/lib/components/AppLayout.test.ts` — NEW (9 tests)
- `apps/web/src/App.svelte` — MODIFIED (import AppLayout, render when authenticated)
- `apps/web/src/App.test.ts` — NEW (3 tests for auth gating)
- `apps/web/src/app.css` — MODIFIED (added shimmer tokens, ui-sans-serif to font stack)
- `apps/web/vitest.config.ts` — MODIFIED (added resolve.conditions: ['browser'])

### Change Log

- 2026-04-20: Story 1.4 implemented — AppLayout component, App auth gate, design token audit, 12 new tests, all passing
