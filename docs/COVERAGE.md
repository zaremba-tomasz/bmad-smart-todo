# Unit Test Coverage Report

> Generated: 2026-04-21 | Vitest 3.2.4 with v8 coverage provider

## Summary

| Package | Tests | Passing | Failing | % Stmts | % Branch | % Funcs | % Lines |
|---|---|---|---|---|---|---|---|
| `apps/api` | 88 | 88 | 0 | 83.91 | 80.74 | 93.33 | 83.91 |
| `apps/web` | 232 | 230 | 2 | 87.75 | 86.02 | 81.10 | 87.75 |
| `packages/shared` | 12 | 12 | 0 | — | — | — | — |
| **Total** | **332** | **330** | **2** | | | | |

`packages/shared` lacks `@vitest/coverage-v8` as a dev dependency, so no coverage data was collected.

## apps/api

88 tests across 10 test files — all passing.

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
|---|---|---|---|---|---|
| **src/services/llm-provider.ts** | 100 | 100 | 100 | 100 | — |
| **src/services/lm-studio.ts** | 100 | 94.11 | 100 | 100 | 75 |
| **src/services/openrouter.ts** | 100 | 95 | 100 | 100 | 92 |
| **src/utils/supabase.ts** | 100 | 100 | 100 | 100 | — |
| **src/utils/transform.ts** | 100 | 100 | 100 | 100 | — |
| **src/routes/health.ts** | 100 | 100 | 100 | 100 | — |
| src/routes/extract.ts | 84.31 | 70.58 | 100 | 84.31 | 31, 38–52 |
| src/routes/tasks.ts | 67.98 | 60.71 | 100 | 67.98 | 112–118, 155–162, 220–226, 230–236 |
| src/middleware/auth.ts | 83.33 | 94.73 | 100 | 83.33 | 26–31, 46–49 |
| src/server.ts | 75 | 75 | 33.33 | 75 | 32–34, 49–56 |

### Observations

- The services and utils layers are at **100% statement coverage**.
- `tasks.ts` is the weakest file at **67.98%** — several Supabase error-handling branches are untested.
- `server.ts` startup/shutdown paths (graceful close, listen errors) are not exercised.

## apps/web

232 tests across 18 test files — 230 passing, 2 failing.

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
|---|---|---|---|---|---|
| **src/lib/config.ts** | 100 | 100 | 100 | 100 | — |
| **src/lib/auth-errors.ts** | 100 | 83.33 | 100 | 100 | 2 |
| **src/lib/utils/format.ts** | 100 | 95 | 100 | 100 | 24–27 |
| **src/lib/components/AiIndicator.svelte** | 100 | 100 | 100 | 100 | — |
| **src/lib/components/EmptyState.svelte** | 100 | 100 | 100 | 100 | — |
| **src/lib/components/SyncIndicator.svelte** | 100 | 100 | 100 | 100 | — |
| **src/lib/components/TaskItem.svelte** | 100 | 94.11 | 100 | 100 | 77 |
| src/lib/components/ExtractionForm.svelte | 99.03 | 84.46 | 42.85 | 99.03 | 230, 310 |
| src/lib/components/PinPrompt.svelte | 94.87 | 87.5 | 100 | 94.87 | 21–22 |
| src/lib/components/TaskList.svelte | 94 | 92.85 | 100 | 94 | 32–34 |
| src/lib/components/CaptureInput.svelte | 88.77 | 84.9 | 77.77 | 88.77 | 29–30, 97–105 |
| src/lib/components/AppLayout.svelte | 85.71 | 75.51 | 68.75 | 85.71 | 69–78, 84–86, 92–93 |
| src/lib/api.ts | 90.16 | 91.66 | 66.66 | 90.16 | 47–48, 73–74, 77–78 |
| src/lib/supabase.ts | 83.33 | 75 | 100 | 83.33 | 11–14 |
| src/lib/stores/auth-store.svelte.ts | 100 | 92.3 | 100 | 100 | 12 |
| src/lib/stores/capture-store.svelte.ts | 100 | 96.96 | 90.9 | 100 | 100 |
| src/lib/stores/task-store.svelte.ts | 84.21 | 78.65 | 91.42 | 84.21 | 329, 350–363, 429 |
| src/App.svelte | 0 | 0 | 0 | 0 | 1–98 |
| src/main.ts | 0 | 0 | 0 | 0 | 1–14 |

### Failing Tests

Both failures are in `src/App.test.ts`:

1. **"renders login form when unauthenticated"** — times out at 5 000 ms; likely a missing mock or unresolved async auth check.
2. **"renders loading state"** — finds duplicate `Loading…` elements in the DOM, indicating a test-isolation issue (previous render not cleaned up).

### Observations

- Components are well covered at **94.38%** aggregate statement coverage.
- `ExtractionForm.svelte` has only **42.85% function coverage** despite high statement coverage — several event handlers are never invoked.
- `task-store.svelte.ts` at **84.21%** has untested offline/sync error paths.
- `App.svelte` and `main.ts` have **0% coverage** due to the failing root-level tests.

## packages/shared

12 tests across 3 test files — all passing. Covers Zod schema validation for `task`, `api`, and `extraction` schemas. No coverage data available (see Summary).

## Gaps and Recommendations

| Priority | Area | Detail |
|---|---|---|
| High | `App.test.ts` failures | Fix the 2 failing tests to restore root-component coverage |
| High | `tasks.ts` route (68%) | Add tests for Supabase error branches and edge cases |
| Medium | `server.ts` (75%) | Test graceful shutdown and listen-error handling |
| Medium | `ExtractionForm` func coverage (43%) | Invoke untested event handlers in existing test suite |
| Medium | `task-store` offline paths (84%) | Cover sync-failure and retry logic |
| Low | `packages/shared` coverage | Add `@vitest/coverage-v8` to collect metrics |
