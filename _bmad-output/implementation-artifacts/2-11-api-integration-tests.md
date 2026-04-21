# Story 2.11: API Integration Tests

Status: review

## Story

As a **developer**,
I want **automated integration tests that exercise API endpoints against a real database**,
so that **I can verify actual request-response cycles, RLS policies, and auth flows beyond mocked unit tests**.

## Acceptance Criteria

1. **Separate test config:** Given the integration test infrastructure is set up, When I run `pnpm test:integration` in the API workspace, Then Vitest runs a separate config (`vitest.integration.config.ts`) that targets `*.integration.test.ts` files, And the script is distinct from the existing `test` (unit tests) script in `apps/api/package.json`.

2. **Real database connection:** Given a local Supabase instance is running (`supabase start`), When the integration tests execute, Then they connect to the real local Supabase database with real RLS policies applied, And test data is created and cleaned up per test (no shared mutable state between tests).

3. **Task route coverage:** Given the task route integration tests run, When they exercise POST /api/tasks, GET /api/tasks, POST /api/tasks/:id/complete, POST /api/tasks/:id/uncomplete, Then each endpoint is tested with real HTTP requests to a running Fastify server, And database state changes are verified (task actually persisted, completion timestamp set, etc.), And response shapes match the shared Zod schemas.

4. **Auth integration coverage:** Given the auth integration tests run, When they exercise protected endpoints, Then requests without a valid JWT receive HTTP 401 with UNAUTHORIZED error code, And requests with a valid JWT for User A cannot access User B's tasks (real RLS enforcement), And the JWT verification cache behaves correctly with real Supabase tokens.

5. **Extraction route coverage:** Given the extraction route integration tests run, When they exercise POST /api/extract, Then rate limiting is verified with real per-user enforcement (30 req/min), And validation errors, timeout handling, and error codes are tested against the real endpoint.

6. **CI pipeline integration:** Given the integration tests run in CI, When the pipeline executes, Then `turbo test:integration` runs as a separate CI gate after unit tests, And the CI job starts a local Supabase instance before running tests, And the gate blocks merge on any test failure.

## Tasks / Subtasks

- [x] Task 1: Create Vitest integration config and wiring (AC: #1)
  - [x] Create `apps/api/vitest.integration.config.ts` targeting `src/**/*.integration.test.ts`
  - [x] Add `"test:integration": "vitest run --config vitest.integration.config.ts"` to `apps/api/package.json`
  - [x] Add `test:integration` task to `turbo.json` (depends on `^build`, runs after unit tests)
  - [x] Add root-level `test:integration` script to `package.json`: `turbo test:integration`

- [x] Task 2: Create integration test helpers and setup (AC: #2)
  - [x] Create `apps/api/src/test-utils/integration-helpers.ts` with:
    - `getTestSupabaseAdmin()` — creates admin Supabase client using local Supabase credentials
    - `createTestUser(email)` — creates a test user via `admin.createUser` with password + `email_confirm: true`
    - `getTestUserToken(email)` — signs in via `signInWithPassword` and returns a valid JWT
    - `cleanupTestTasks(userId)` — hard-deletes (not soft-delete) test tasks from `tasks` table via admin client
    - `cleanupTestUser(email)` — removes test user via `admin.deleteUser` (optional, for full cleanup)
  - [x] Create `apps/api/src/test-utils/integration-setup.ts` with global setup that verifies Supabase is reachable
  - [x] Auth strategy: use `admin.createUser` + `signInWithPassword` for parallel-safe authentication (same pattern proven in E2E story 2.10)

- [x] Task 3: Create task route integration tests (AC: #3)
  - [x] New file: `apps/api/src/routes/tasks.integration.test.ts`
  - [x] Test: POST /api/tasks — create a task with valid body → verify HTTP 201, response matches `TaskSchema`, task actually exists in database via admin query
  - [x] Test: POST /api/tasks — create with all fields (title, dueDate, dueTime, location, priority) → verify all fields persisted correctly
  - [x] Test: POST /api/tasks — validation error on missing title → verify HTTP 400, VALIDATION_ERROR code
  - [x] Test: GET /api/tasks — returns only non-deleted tasks for the authenticated user, sorted by priority weight then due date
  - [x] Test: GET /api/tasks — does not return soft-deleted tasks (create a task, soft-delete via admin, verify not returned)
  - [x] Test: POST /api/tasks/:id/complete — sets is_completed=true and completed_at is a valid timestamp
  - [x] Test: POST /api/tasks/:id/complete — returns 404 for non-existent task ID
  - [x] Test: POST /api/tasks/:id/complete — returns 404 for soft-deleted task (RLS + deleted_at filter)
  - [x] Test: POST /api/tasks/:id/uncomplete — clears is_completed and completed_at
  - [x] Test: POST /api/tasks/:id — returns 400 for invalid UUID format
  - [x] Test: response shapes match shared Zod `TaskSchema` for all successful responses (camelCase, nullable fields explicit)
  - [x] Each test creates its own data and cleans up via `cleanupTestTasks`

- [x] Task 4: Create auth integration tests (AC: #4)
  - [x] New file: `apps/api/src/middleware/auth.integration.test.ts`
  - [x] Test: request without Authorization header → HTTP 401, UNAUTHORIZED code
  - [x] Test: request with invalid/expired token → HTTP 401, UNAUTHORIZED code
  - [x] Test: request with valid JWT → HTTP 200, user_id extracted from JWT (not from request params)
  - [x] Test: User A creates a task → User B's GET /api/tasks does NOT return User A's task (real RLS isolation)
  - [x] Test: User B cannot complete/uncomplete User A's task → HTTP 404 (RLS prevents access)
  - [x] Test: JWT verification cache — second request with same token does not incur additional Supabase round-trip (observable via response time or by counting auth API calls if feasible)
  - [x] Use two distinct test user emails to prove cross-user isolation

- [x] Task 5: Create extraction route integration tests (AC: #5)
  - [x] New file: `apps/api/src/routes/extract.integration.test.ts`
  - [x] Test: POST /api/extract without auth → HTTP 401
  - [x] Test: POST /api/extract with empty text → HTTP 400, VALIDATION_ERROR
  - [x] Test: POST /api/extract with missing text → HTTP 400, VALIDATION_ERROR
  - [x] Test: rate limiting — fire 30 requests in rapid succession, verify 31st returns HTTP 429 RATE_LIMITED
  - [x] LLM provider strategy: mock the LLM provider at the service layer level (not the HTTP level) to avoid external dependency while still testing the full Fastify request lifecycle, auth, rate limiting, validation, and Pino logging
  - [x] Test: successful extraction returns data matching `ExtractionResultSchema`
  - [x] Test: provider error returns HTTP 502 EXTRACTION_PROVIDER_ERROR
  - [x] Test: timeout returns HTTP 408 EXTRACTION_TIMEOUT

- [x] Task 6: Update CI pipeline (AC: #6)
  - [x] Add `integration-tests` job to `.github/workflows/ci.yml`
  - [x] Job runs after `test` (unit tests), needs `[build]`
  - [x] Starts local Supabase: `supabase start -x realtime,storage,imgproxy,edge-runtime,logflare,vector,supavisor`
  - [x] Creates `apps/api/.env` with local Supabase credentials (same pattern as E2E job)
  - [x] Runs `pnpm test:integration`
  - [x] Cleans up Supabase on `always()`
  - [x] Blocks merge on failure

- [x] Task 7: Verify all tests pass and update sprint status
  - [x] Run `pnpm test:integration` locally with `supabase start` running
  - [x] Verify all integration tests pass
  - [x] Verify existing unit tests (`pnpm test`) still pass (no regressions)
  - [x] Verify lint and typecheck pass

## Dev Notes

### Architecture Compliance

**Existing unit tests are mocked — this story adds real-database coverage.** The 10 existing test files in `apps/api/src/` use `vi.mock()` to stub Supabase. This gives fast, isolated unit coverage but misses real RLS policy enforcement, actual database persistence, snake_case↔camelCase transform roundtrips against real data, and JWT verification with real Supabase tokens. Integration tests complement — not replace — unit tests.

**Use `buildServer()` from `apps/api/src/server.ts`.** The existing `buildServer()` function creates a fully configured Fastify instance with auth middleware, rate limiting, and all routes. Integration tests should use this function directly (via `fastify.inject()`) rather than manually wiring routes. This ensures tests exercise the real middleware pipeline. The server module guards `fastify.listen()` behind `process.env.VITEST !== 'true'`, so importing it in tests is safe.

**Supabase local instance is required.** Integration tests connect to the real local Supabase (started via `supabase start`). The local instance uses the same schema and RLS policies as production (applied via `supabase/migrations/20260420000000_initial_schema.sql`). This validates that RLS policies actually enforce user isolation.

**Auth strategy — use `admin.createUser` + `signInWithPassword`.** This pattern was validated in Story 2.10 (E2E tests). It avoids OTP token conflicts during parallel test execution and produces real Supabase JWTs that the API's auth middleware can verify via `supabase.auth.getUser()`.

**Environment variables for integration tests.** The API reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from the environment. Integration tests need these set to local Supabase values. Use `vi.stubEnv()` in the Vitest config's `globalSetup` or in a setup file, or load from `apps/api/.env` which already has local credentials for development. The existing `.env` file (created during development) should work — no new env file needed.

**LLM provider in integration tests.** The extraction endpoint depends on an LLM provider. For integration tests, mock the provider at the service layer level (similar to existing unit tests) while keeping the full Fastify request lifecycle real. This tests auth, rate limiting, Zod validation, and Pino logging without requiring an actual LLM service. Alternatively, use `vi.mock('../services/llm-provider.js')` in the integration test setup — acceptable because the purpose of extraction integration tests is to verify the API layer behavior (auth, rate limit, error codes), not the LLM provider itself.

### Previous Story Intelligence

**From Story 2.10 (E2E Test Suite) — key patterns to reuse:**
- Auth helper using `admin.createUser` + `signInWithPassword` is reliable for parallel execution
- Each test file should use a unique test user email to prevent cross-file data contamination
- `deleteAllTasksForUser()` via admin client for cleanup — use hard delete (SQL DELETE) for integration tests instead of soft-delete to avoid accumulating test data
- Local Supabase credentials: URL=`http://127.0.0.1:54321`, anon key and service role key are the standard local dev values (see `e2e/fixtures/test-data.ts` or the CI `.env` creation block)
- 26 E2E tests + 230 unit tests passing — integration tests must not break existing tests

**From Story 2.10 — CI Supabase pattern:**
The E2E CI job already starts Supabase with `supabase start -x realtime,storage,imgproxy,edge-runtime,logflare,vector,supavisor` and creates an `apps/api/.env` file. The integration test CI job should follow the same pattern.

**From unit test codebase — existing patterns to maintain consistency:**
- `fastify.inject()` for sending HTTP requests (Fastify's built-in test method)
- `beforeEach` / `afterEach` with `vi.clearAllMocks()` and `fastify.close()`
- Response assertions on `response.statusCode`, `response.json().data`, `response.json().error.code`
- UUID validation with `IdParamsSchema` returning 400 VALIDATION_ERROR on invalid IDs
- Error codes from `ErrorCode.enum` in `@smart-todo/shared`

**Known issues from previous stories:**
- 2 pre-existing `App.test.ts` unit test failures (frontend, unrelated to API)
- `CreateMutationSchema` missing `urgent` priority in localStorage replay (pre-existing from Story 2.1, not relevant to API integration tests)
- axe-core `color-contrast` exception in E2E tests (UI issue, not relevant here)

### Critical Implementation Details

**Test data isolation is paramount.** Each test must create its own users and tasks, and clean up afterwards. Use unique email addresses per test file (e.g., `int-tasks-a@test.local`, `int-tasks-b@test.local`, `int-auth-a@test.local`, etc.). Never rely on data from other tests.

**Hard delete for cleanup, not soft delete.** Unlike E2E tests which used `update({ deleted_at })` for cleanup, integration tests should use admin client to hard-delete test data (`DELETE FROM tasks WHERE user_id = ...`). This prevents accumulating soft-deleted records across test runs and ensures each test starts truly clean.

**Integration test file naming: `*.integration.test.ts`.** The Vitest config for integration tests uses `include: ['src/**/*.integration.test.ts']` to target only integration tests. The existing unit test config uses `include: ['src/**/*.test.ts']` which ALSO matches `*.integration.test.ts` — update the unit test config to `exclude: ['**/*.integration.test.ts']` to prevent overlap.

**`buildServer()` includes rate limiting.** The rate limit plugin uses `@fastify/rate-limit` keyed by `request.userId`. Because integration tests use real auth, `request.userId` will be set by the auth middleware. Rate limit state persists across requests within the same Fastify instance. For rate limit tests, create a dedicated Fastify instance to avoid cross-test interference. For non-rate-limit tests, either use a fresh Fastify instance per test or accept that rate limits could interfere if tests are heavy — the 30 req/min limit is generous enough that normal test suites won't hit it.

**Fastify instance lifecycle.** Create the Fastify instance in `beforeAll` (once per `describe` block) using `buildServer()`, and close it in `afterAll`. Use `beforeEach` for data cleanup only. This avoids the overhead of booting Fastify for every test while keeping data isolated.

**camelCase responses.** The API's transform layer converts snake_case database rows to camelCase JSON. Integration tests should verify this roundtrip works with real data — assert on camelCase field names in responses (`dueDate`, `isCompleted`, `completedAt`, not `due_date`, `is_completed`, `completed_at`).

**Zod schema validation in assertions.** Use the shared Zod schemas from `@smart-todo/shared` to validate response shapes in tests: `TaskSchema.parse(response.json().data)` should not throw. This verifies the API contract end-to-end.

### File Structure Requirements

**New files:**
- `apps/api/vitest.integration.config.ts`
- `apps/api/src/test-utils/integration-helpers.ts`
- `apps/api/src/routes/tasks.integration.test.ts`
- `apps/api/src/middleware/auth.integration.test.ts`
- `apps/api/src/routes/extract.integration.test.ts`

**Modified files:**
- `apps/api/package.json` — add `test:integration` script
- `apps/api/vitest.config.ts` — add exclude for `*.integration.test.ts`
- `turbo.json` — add `test:integration` task
- `.github/workflows/ci.yml` — add integration tests job
- `package.json` (root) — add `test:integration` script if not present

**NOT modified (scope guard):**
- No `apps/web/` changes — this is API testing only
- No `packages/shared/` changes — schemas are complete for Epic 2
- No `e2e/` changes — E2E tests remain as-is
- No Supabase migration changes — schema is already correct
- No `apps/api/src/routes/*.ts` source changes — integration tests observe the existing API
- No `apps/api/src/middleware/*.ts` source changes

### Testing Requirements

**Framework:** Vitest 3.2.4 (already installed in `apps/api`)

**Additional dependencies needed:** None. `@supabase/supabase-js` is already a dependency in `apps/api`. Vitest is already installed. The admin client for test setup uses the same Supabase SDK.

**Patterns to follow:**
- `buildServer()` from `apps/api/src/server.ts` for the Fastify instance
- `fastify.inject()` for HTTP requests (no real network — Fastify internal routing)
- Shared Zod schemas from `@smart-todo/shared` for response validation
- `admin.createUser()` + `signInWithPassword()` for real JWT acquisition
- Unique test user emails per test file (prevents cross-file contamination)
- `beforeAll` / `afterAll` for Fastify lifecycle; `beforeEach` for data cleanup
- Hard-delete test data in cleanup (not soft-delete)

**Test coverage targets:**
- Task CRUD: create, list, complete, uncomplete — all with real DB
- Auth: unauthenticated, invalid token, valid token, cross-user RLS isolation
- Extract: auth enforcement, validation errors, rate limiting, error codes
- All response shapes validated against shared Zod schemas

### Project Structure Notes

- Integration test files live next to unit tests in `apps/api/src/` — co-located by convention
- Naming convention: `*.integration.test.ts` distinguishes from `*.test.ts` unit tests
- `apps/api/src/test-utils/` is a new directory for integration-only helpers — not exported, not published, excluded from production build
- `tsconfig.json` already excludes `**/*.test.ts` — verify it also covers `**/*.integration.test.ts` (it should, since `*.integration.test.ts` matches `*.test.ts` glob)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.11] — acceptance criteria and scope
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Framework] — Vitest for unit and integration, co-located tests
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD Pipeline] — 8 CI gates, test gate
- [Source: _bmad-output/planning-artifacts/architecture.md#Security Hardening] — JWT verification, RLS policies, rate limiting
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — tasks table schema, RLS policies, soft-delete
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — error codes, response format, extraction timeout
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Conventions] — snake_case DB ↔ camelCase API transform
- [Source: apps/api/src/server.ts] — `buildServer()` factory function, middleware pipeline
- [Source: apps/api/src/routes/tasks.ts] — task route implementation, sortTasks, parseTaskRow
- [Source: apps/api/src/middleware/auth.ts] — auth middleware, JWT verification cache, `clearVerificationCache()`
- [Source: apps/api/src/routes/extract.ts] — extraction route, rate limiting config, Pino logging
- [Source: apps/api/src/utils/supabase.ts] — `getSupabaseAdmin()`, `createSupabaseClient()`, `resetAdminClient()`
- [Source: supabase/migrations/20260420000000_initial_schema.sql] — tasks table DDL, RLS policies
- [Source: _bmad-output/implementation-artifacts/2-10-e2e-test-suite.md] — E2E auth strategy, CI Supabase pattern, test isolation patterns
- [Source: e2e/fixtures/test-helpers.ts] — proven auth pattern: `admin.createUser` + `signInWithPassword`
- [Source: .github/workflows/ci.yml] — existing CI jobs including E2E with Supabase

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed ESLint import-x/order lint error: `../server.js` must be imported before `../test-utils/integration-helpers.js` (alphabetical grouping)

### Completion Notes List

- Created Vitest integration config with globalSetup to verify Supabase connectivity
- Added exclude for `*.integration.test.ts` in unit test config to prevent overlap
- Created integration helpers with `getTestSupabaseAdmin`, `createTestUser`, `getTestUserToken`, `cleanupTestTasks`, `cleanupTestUser`, and `setIntegrationEnv`
- Implemented 11 task route integration tests covering CRUD, soft-delete filtering, UUID validation, sorting, and Zod schema validation
- Implemented 7 auth integration tests covering unauthenticated/invalid token, cross-user RLS isolation (2 users), complete/uncomplete RLS enforcement, and JWT cache performance
- Implemented 7 extraction route integration tests covering auth, validation, rate limiting (30 req/min), provider errors, and timeout — LLM mocked at service layer
- Added `integration-tests` CI job to `.github/workflows/ci.yml` following existing E2E Supabase pattern
- All 25 integration tests pass, 88 unit tests pass (no regressions), lint and typecheck clean

### File List

New files:
- apps/api/vitest.integration.config.ts
- apps/api/src/test-utils/integration-helpers.ts
- apps/api/src/test-utils/integration-setup.ts
- apps/api/src/routes/tasks.integration.test.ts
- apps/api/src/middleware/auth.integration.test.ts
- apps/api/src/routes/extract.integration.test.ts

Modified files:
- apps/api/package.json — added `test:integration` script
- apps/api/vitest.config.ts — added exclude for `*.integration.test.ts`
- turbo.json — added `test:integration` task
- .github/workflows/ci.yml — added `integration-tests` CI job
- package.json (root) — added `test:integration` script
- _bmad-output/implementation-artifacts/sprint-status.yaml — status updated
- _bmad-output/implementation-artifacts/2-11-api-integration-tests.md — story updated

### Change Log

- 2026-04-21: Implemented Story 2.11 — API Integration Tests. Added 25 integration tests across 3 test files (tasks, auth, extract) exercising real Supabase database with RLS policies. Added CI pipeline gate.
