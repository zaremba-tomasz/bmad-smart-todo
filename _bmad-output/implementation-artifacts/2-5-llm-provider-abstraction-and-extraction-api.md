# Story 2.5: LLM Provider Abstraction & Extraction API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the system to extract structured task data from my natural language input,
So that I don't have to manually fill in dates, priorities, and locations.

## Acceptance Criteria

1. **Basic extraction:** Given the API receives POST /api/extract with `{ text: "Call the dentist next Monday, high priority" }`, when the extraction service processes the request, then only the raw task text is sent to the LLM provider — no user metadata, task history, or group information (FR38). The LLM is prompted to return structured output matching the ExtractionResultSchema. The response is validated against the Zod schema before returning to the client.

2. **Successful response shape:** Given the LLM returns a valid extraction, when the API responds, then the response contains `{ data: { title, dueDate, dueTime, location, priority, recurrence } }` with nullable fields (explicit null for fields not extracted, never omitted).

3. **Validation failure:** Given the LLM response does not match the ExtractionResultSchema, when Zod validation fails, then the API returns `{ error: { code: "EXTRACTION_VALIDATION_FAILED", message: "..." } }` and the failure is logged via Pino with `{ event: "extraction", status: "validation_failed", duration_ms, model, provider }`.

4. **Timeout handling:** Given the LLM provider does not respond within 4.5 seconds, when the API-side timeout fires, then the API returns `{ error: { code: "EXTRACTION_TIMEOUT", message: "..." } }` and the timeout is logged via Pino with `{ event: "extraction", status: "timeout", duration_ms, model, provider }`.

5. **Provider error handling:** Given the LLM provider returns a non-timeout error (auth failure, model deprecated, malformed response), when the error is caught, then the API returns `{ error: { code: "EXTRACTION_PROVIDER_ERROR", message: "..." } }` and the error is logged with `{ event: "extraction", status: "provider_error", duration_ms, model, provider }`.

6. **Structured logging:** Given every extraction attempt, when it completes (success or failure), then a structured Pino log entry is written: `{ event: "extraction", status, duration_ms, model, provider }`.

7. **OpenRouter provider:** Given LLM_PROVIDER env is set to "openrouter", when the extraction service initializes, then it uses the OpenRouter implementation with the model specified in OPENROUTER_MODEL. Requests use JSON Schema `response_format` for structured output. Provider filtering enforces no-training policy (FR39).

8. **LM Studio provider:** Given LLM_PROVIDER env is set to "lmstudio", when the extraction service initializes, then it uses the LM Studio implementation pointing to LM_STUDIO_URL. The same Zod schema validation is applied to the response.

9. **Config-only switching:** Given I want to switch providers, when I change only the LLM_PROVIDER, OPENROUTER_MODEL, or LM_STUDIO_URL environment variables, then the provider switches without any code changes (FR42).

10. **Per-user rate limiting:** Given I am an authenticated user, when I call POST /api/extract, then the request is rate-limited to 30 requests per minute per user_id (from JWT). Exceeding the limit returns `{ error: { code: "RATE_LIMITED" } }`.

## Tasks / Subtasks

- [x] Task 1: Create the LLM provider abstraction layer (AC: #7, #8, #9)
  - [x] 1.1 Create `apps/api/src/services/llm-provider.ts` — define the `LLMProvider` interface and factory function
  - [x] 1.2 Create `apps/api/src/services/openrouter.ts` — OpenRouter implementation using `response_format` with JSON Schema structured output, `require_parameters: true` provider preference, and no-training provider filtering
  - [x] 1.3 Create `apps/api/src/services/lm-studio.ts` — LM Studio implementation using OpenAI-compatible `/v1/chat/completions` endpoint with `response_format` JSON Schema
  - [x] 1.4 Both providers must: send only raw text in the prompt (FR38), enforce the 4.5s timeout on the outbound HTTP request, return the parsed result or throw a typed error

- [x] Task 2: Create the extract request schema (AC: #1, #2)
  - [x] 2.1 Add `ExtractRequestSchema` to `packages/shared/src/schemas/extraction.ts` — `{ text: z.string().min(1) }`
  - [x] 2.2 Export it from `packages/shared/src/schemas/index.ts`

- [x] Task 3: Create the extraction route (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `apps/api/src/routes/extract.ts` — POST /api/extract route
  - [x] 3.2 Validate request body against `ExtractRequestSchema`
  - [x] 3.3 Call the LLM provider via the factory, validate result against `ExtractionResultSchema`
  - [x] 3.4 Handle all error cases: timeout → EXTRACTION_TIMEOUT, provider error → EXTRACTION_PROVIDER_ERROR, validation failure → EXTRACTION_VALIDATION_FAILED
  - [x] 3.5 Log every extraction attempt as structured Pino JSON: `{ event: "extraction", status, duration_ms, model, provider }`
  - [x] 3.6 Return `{ data: ExtractionResult }` on success

- [x] Task 4: Wire rate limiting and route registration (AC: #10)
  - [x] 4.1 Register `@fastify/rate-limit` plugin in `apps/api/src/server.ts` for the `/api/extract` route only — 30 req/min per user_id from JWT
  - [x] 4.2 Register `extractRoutes` in `server.ts`
  - [x] 4.3 Ensure the auth preHandler hook applies to `/api/extract` (it already applies to all `/api/*` except `/api/health`)

- [x] Task 5: Create provider unit tests (AC: #7, #8)
  - [x] 5.1 Create `apps/api/src/services/llm-provider.test.ts` — factory selects correct provider based on env
  - [x] 5.2 Create `apps/api/src/services/openrouter.test.ts` — mock HTTP, test structured output request shape, test timeout, test error handling, test no-training provider filtering
  - [x] 5.3 Create `apps/api/src/services/lm-studio.test.ts` — mock HTTP, test OpenAI-compat request shape, test timeout, test error handling

- [x] Task 6: Create extraction route tests (AC: #1-#6, #10)
  - [x] 6.1 Create `apps/api/src/routes/extract.test.ts` — test success, validation failure, timeout, provider error, structured logging, rate limiting
  - [x] 6.2 Update `apps/api/src/server.test.ts` if needed to confirm auth middleware runs for `/api/extract`

- [x] Task 7: Verify lint, typecheck, all tests pass (AC: all)
  - [x] 7.1 `pnpm lint` — 0 errors
  - [x] 7.2 `pnpm typecheck` — 0 errors
  - [x] 7.3 `pnpm test` — all tests pass (shared + api + web)
  - [x] 7.4 `pnpm build` — succeeds

### Review Findings

- [x] [Review][Patch] Enforce strict per-user rate-limiting keyed only by JWT `userId` and ensure limiter executes after auth hook [apps/api/src/server.ts]
- [x] [Review][Patch] Avoid exposing internal provider/configuration details in `EXTRACTION_PROVIDER_ERROR` responses [apps/api/src/routes/extract.ts]
- [x] [Review][Patch] Make timeout detection robust for non-`DOMException` abort errors so timeouts consistently map to `EXTRACTION_TIMEOUT` [apps/api/src/services/openrouter.ts]
- [x] [Review][Patch] Make timeout detection robust for non-`DOMException` abort errors so timeouts consistently map to `EXTRACTION_TIMEOUT` [apps/api/src/services/lm-studio.ts]
- [x] [Review][Patch] Add automated test coverage for 429 `RATE_LIMITED` behavior on `POST /api/extract` [apps/api/src/routes/extract.test.ts]

## Dev Notes

### Architecture Constraints (MUST FOLLOW)

- **Monorepo:** Turborepo + pnpm workspaces. Packages: `@smart-todo/web`, `@smart-todo/api`, `@smart-todo/shared`
- **Backend stack:** Fastify 5.x BFF with Pino logging (built-in). TypeScript strict mode
- **Naming conventions:** snake_case DB → camelCase API JSON → camelCase TypeScript
- **Error format:** `{ error: { code: ErrorCode, message: string } }` — consistent across all routes
- **`request.userId`** comes from verified JWT via auth middleware — NEVER from request body
- **`request.supabaseClient`** is per-request, scoped to user's JWT for RLS enforcement
- **API calls via `lib/api.ts`** on the frontend (not relevant to this story, but don't create SPA-side code)
- **Co-located tests:** Test files next to source (e.g., `openrouter.test.ts` beside `openrouter.ts`)
- **Imports:** use `.js` extension in import paths (ESM: `import { foo } from './bar.js'`)
- **No new `$effect()` calls** — this story is backend-only

### Existing Code to Extend (DO NOT Recreate)

**`packages/shared/src/schemas/extraction.ts`** — ExtractionResultSchema already exists:
```typescript
const ExtractionResultSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable(),
  dueTime: z.string().nullable(),
  location: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable(),
  recurrence: z.object({
    pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().nullable(),
    dayOfWeek: z.string().nullable(),
    dayOfMonth: z.number().nullable(),
  }).nullable(),
})
```
**ADD** `ExtractRequestSchema` to this file. **DO NOT modify** `ExtractionResultSchema`.

**`packages/shared/src/schemas/api.ts`** — ErrorCode enum already includes extraction error codes:
- `EXTRACTION_TIMEOUT`
- `EXTRACTION_PROVIDER_ERROR`
- `EXTRACTION_VALIDATION_FAILED`
- `RATE_LIMITED`
**DO NOT modify.**

**`packages/shared/src/schemas/index.ts`** — Re-exports. **ADD** `ExtractRequestSchema` export.

**`apps/api/src/server.ts`** — Route registration and auth middleware:
- `authMiddleware` runs for all `/api/*` except `/api/health`
- Currently registers `healthRoutes` and `taskRoutes`
- **MODIFY** to also register `extractRoutes` and `@fastify/rate-limit`

**`apps/api/src/middleware/auth.ts`** — JWT verification with 60s cache. Sets `request.userId` and `request.supabaseClient`. **DO NOT modify.**

**`apps/api/src/utils/transform.ts`** — `snakeToCamel` / `camelToSnake`. **DO NOT modify** (not needed for this story — extraction doesn't touch the database).

**`apps/api/src/routes/tasks.ts`** — Reference for route pattern:
- Uses `ErrorCode.enum.VALIDATION_ERROR` for Zod parse failures
- Uses `ApiSuccessSchema(schema)` for response wrapping
- Follows `(request, reply) => { ... }` Fastify handler pattern
- **DO NOT modify.**

**`apps/api/src/types.d.ts`** — Augments `FastifyRequest` with `userId: string` and `supabaseClient: SupabaseClient`. **DO NOT modify.**

### LLM Provider Abstraction Design

Create `apps/api/src/services/llm-provider.ts`:

```typescript
import type { z } from 'zod'
import type { ExtractionResultSchema } from '@smart-todo/shared'

type ExtractionResult = z.infer<typeof ExtractionResultSchema>

export interface LLMProvider {
  extract(text: string): Promise<ExtractionResult>
}

export class ExtractionTimeoutError extends Error {
  constructor() { super('LLM extraction timed out') }
}

export class ExtractionProviderError extends Error {
  constructor(message: string) { super(message) }
}

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? 'openrouter'
  switch (provider) {
    case 'openrouter': return createOpenRouterProvider()
    case 'lmstudio': return createLMStudioProvider()
    default: throw new Error(`Unknown LLM provider: ${provider}`)
  }
}
```

Use custom error classes (`ExtractionTimeoutError`, `ExtractionProviderError`) to distinguish failure modes in the route handler. The route handler catches these and maps to the correct error code.

### OpenRouter Implementation Details

File: `apps/api/src/services/openrouter.ts`

**API endpoint:** `https://openrouter.ai/api/v1/chat/completions`

**Request shape:**
```typescript
{
  model: process.env.OPENROUTER_MODEL, // e.g. "meta-llama/llama-3.1-70b-instruct"
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: text }  // Only raw text, nothing else (FR38)
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'extraction_result',
      strict: true,
      schema: jsonSchemaFromZod  // Convert ExtractionResultSchema to JSON Schema
    }
  },
  provider: {
    require_parameters: true,   // Ensure model supports structured output
    data_collection: 'deny'     // FR39: no-training policy
  }
}
```

**Headers:**
```typescript
{
  'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://smart-todo.app',  // Required by OpenRouter
  'X-Title': 'Smart Todo'                     // App identification
}
```

**Timeout:** Use `AbortController` with 4500ms timeout on the `fetch` call. On abort, throw `ExtractionTimeoutError`.

**Response parsing:** The LLM response arrives as `choices[0].message.content` (a JSON string). Parse it with `JSON.parse()`, then validate with `ExtractionResultSchema.parse()`.

**Zod to JSON Schema conversion:** Use `zod-to-json-schema` library (add as dependency) to convert `ExtractionResultSchema` to JSON Schema for the `response_format` field. Install: `pnpm add zod-to-json-schema` in `apps/api`.

### LM Studio Implementation Details

File: `apps/api/src/services/lm-studio.ts`

**API endpoint:** `${process.env.LM_STUDIO_URL}/v1/chat/completions` (default: `http://localhost:1234/v1/chat/completions`)

**Request shape:** Identical to OpenRouter (OpenAI-compatible) but without the `provider` field and without the `Authorization` header. LM Studio doesn't require auth for local inference.

```typescript
{
  model: 'local-model',  // LM Studio ignores this, uses the loaded model
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: text }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'extraction_result',
      strict: true,
      schema: jsonSchemaFromZod
    }
  }
}
```

**Timeout:** Same 4500ms `AbortController` pattern as OpenRouter.

### System Prompt Design

Both providers share the same system prompt. Define it once in `llm-provider.ts` or a shared constant:

```
You are a task extraction assistant. Extract structured information from the user's natural language task description.

Extract the following fields:
- title: A clear, concise task title
- dueDate: Date in YYYY-MM-DD format, or null if no date mentioned
- dueTime: Time in HH:mm format (24-hour), or null if no time mentioned
- location: Location or place mentioned, or null if none
- priority: One of "low", "medium", "high", "urgent", or null if not mentioned
- recurrence: If the task repeats, extract pattern/interval/dayOfWeek/dayOfMonth, or null if not recurring

Return ONLY the JSON object. Do not include any explanation or text outside the JSON.
```

### Extraction Route Pattern

File: `apps/api/src/routes/extract.ts`

```typescript
export async function extractRoutes(fastify: FastifyInstance) {
  fastify.post('/api/extract', async (request, reply) => {
    const parsed = ExtractRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: ErrorCode.enum.VALIDATION_ERROR, message: '...' }
      })
    }

    const startTime = Date.now()
    const provider = createLLMProvider()
    const providerName = process.env.LLM_PROVIDER ?? 'openrouter'
    const model = process.env.OPENROUTER_MODEL ?? 'unknown'

    try {
      const result = await provider.extract(parsed.data.text)

      // Validate against schema (defense in depth)
      const validated = ExtractionResultSchema.safeParse(result)
      if (!validated.success) {
        const durationMs = Date.now() - startTime
        request.log.info({ event: 'extraction', status: 'validation_failed', duration_ms: durationMs, model, provider: providerName })
        return reply.status(422).send({
          error: { code: ErrorCode.enum.EXTRACTION_VALIDATION_FAILED, message: '...' }
        })
      }

      const durationMs = Date.now() - startTime
      request.log.info({ event: 'extraction', status: 'success', duration_ms: durationMs, model, provider: providerName })
      return reply.send({ data: validated.data })

    } catch (err) {
      const durationMs = Date.now() - startTime
      if (err instanceof ExtractionTimeoutError) {
        request.log.info({ event: 'extraction', status: 'timeout', duration_ms: durationMs, model, provider: providerName })
        return reply.status(408).send({
          error: { code: ErrorCode.enum.EXTRACTION_TIMEOUT, message: '...' }
        })
      }
      request.log.info({ event: 'extraction', status: 'provider_error', duration_ms: durationMs, model, provider: providerName })
      return reply.status(502).send({
        error: { code: ErrorCode.enum.EXTRACTION_PROVIDER_ERROR, message: '...' }
      })
    }
  })
}
```

### Rate Limiting Setup

`@fastify/rate-limit` is already in `package.json` (v10.3.0) but NOT wired in `server.ts`. Register it with route-specific config:

```typescript
import rateLimit from '@fastify/rate-limit'

// In buildServer():
fastify.register(rateLimit, {
  max: 30,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.userId,
  hook: 'preHandler',
  allowList: [],
  errorResponseBuilder: () => ({
    error: { code: 'RATE_LIMITED', message: 'Too many extraction requests. Try again later.' }
  }),
  routeConfig: {
    rateLimit: false  // Default: no rate limit on routes
  }
})
```

Then in the extract route, enable rate limiting specifically:

```typescript
fastify.post('/api/extract', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, handler)
```

**Important:** `keyGenerator` uses `request.userId` which is set by `authMiddleware` in the `preHandler` hook. The rate limit plugin must run AFTER auth middleware sets `userId`. Since auth runs as a global `preHandler`, and `@fastify/rate-limit` with `hook: 'preHandler'` runs as an `onRequest` hook by default, adjust the hook config to ensure proper ordering. Use `hook: 'preHandler'` so it runs after auth.

### HTTP Client Pattern

Use native `fetch` (available in Node.js 18+) with `AbortController` for timeout:

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 4500)

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
  clearTimeout(timeoutId)

  if (!response.ok) {
    throw new ExtractionProviderError(`Provider returned ${response.status}`)
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new ExtractionProviderError('No content in provider response')
  }

  return JSON.parse(content)
} catch (err) {
  clearTimeout(timeoutId)
  if (err instanceof DOMException && err.name === 'AbortError') {
    throw new ExtractionTimeoutError()
  }
  if (err instanceof ExtractionTimeoutError || err instanceof ExtractionProviderError) {
    throw err
  }
  throw new ExtractionProviderError(err instanceof Error ? err.message : 'Unknown error')
}
```

**No additional HTTP libraries needed** — use Node.js native `fetch`. Do NOT add `axios`, `node-fetch`, `undici`, or similar.

### New Dependency Required

Add `zod-to-json-schema` to `apps/api`:
```bash
cd apps/api && pnpm add zod-to-json-schema
```

This converts the Zod `ExtractionResultSchema` to a JSON Schema object for the `response_format` parameter. Both OpenRouter and LM Studio accept JSON Schema in the same format.

### Project Structure Notes

**New files to create:**
```
apps/api/src/
├── services/
│   ├── llm-provider.ts          # Interface + factory + error classes + system prompt
│   ├── llm-provider.test.ts     # Factory tests
│   ├── openrouter.ts            # OpenRouter provider implementation
│   ├── openrouter.test.ts       # OpenRouter unit tests (mock fetch)
│   ├── lm-studio.ts             # LM Studio provider implementation
│   └── lm-studio.test.ts        # LM Studio unit tests (mock fetch)
├── routes/
│   ├── extract.ts               # POST /api/extract route
│   └── extract.test.ts          # Extraction route tests
```

**Files to modify:**
```
apps/api/src/server.ts                          # Register extractRoutes + @fastify/rate-limit
packages/shared/src/schemas/extraction.ts       # Add ExtractRequestSchema
packages/shared/src/schemas/index.ts            # Export ExtractRequestSchema
```

### Testing Patterns

**Provider tests (mock `fetch`):**
- Use `vi.stubGlobal('fetch', mockFetch)` to mock the native fetch
- Test: successful extraction returns parsed result
- Test: 4.5s timeout throws `ExtractionTimeoutError`
- Test: non-200 response throws `ExtractionProviderError`
- Test: malformed JSON in response throws `ExtractionProviderError`
- Test: missing `choices[0].message.content` throws `ExtractionProviderError`
- Test: OpenRouter request includes `provider.data_collection: 'deny'` and `require_parameters: true`
- Test: request body contains only the raw text in the user message (FR38 privacy)
- Test: `AbortController` signal is passed to fetch

**Route tests (mock provider):**
- Mock `createLLMProvider` to return a mock provider
- Test: valid input returns `{ data: ExtractionResult }` with HTTP 200
- Test: invalid input (missing text) returns VALIDATION_ERROR with HTTP 400
- Test: provider timeout returns EXTRACTION_TIMEOUT with HTTP 408
- Test: provider error returns EXTRACTION_PROVIDER_ERROR with HTTP 502
- Test: invalid extraction result returns EXTRACTION_VALIDATION_FAILED with HTTP 422
- Test: structured log entry is written for each outcome (spy on `request.log.info`)
- Test: auth middleware is required (request without Bearer token fails)

**Fastify test pattern (from existing codebase):**
```typescript
import { buildServer } from '../server.js'

const fastify = buildServer()
// Mock auth middleware to set request.userId
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (request) => { request.userId = 'test-user-id' })
}))

const response = await fastify.inject({
  method: 'POST',
  url: '/api/extract',
  headers: { authorization: 'Bearer test-token' },
  payload: { text: 'Call the dentist next Monday' }
})
```

### Anti-Patterns (DO NOT)

- **DO NOT** store extraction results in the database — this story is API-only, extraction results are returned to the client
- **DO NOT** create SPA-side code (capture store, extraction form) — those are Stories 2.6 and 2.7
- **DO NOT** add `axios`, `node-fetch`, or other HTTP client libraries — use native `fetch`
- **DO NOT** expose API keys to the client — OpenRouter key stays in API env vars only
- **DO NOT** send user metadata, task history, or group names to the LLM (FR38)
- **DO NOT** modify `ExtractionResultSchema` — it's already correct in shared package
- **DO NOT** modify auth middleware or task routes
- **DO NOT** use Svelte stores or `$effect()` — this is backend-only
- **DO NOT** store recurrence in the database — it's extracted and returned but not persisted in MVP
- **DO NOT** create a separate rate-limit middleware file — use `@fastify/rate-limit` plugin config
- **DO NOT** add Pino as a dependency — Fastify includes it (`request.log` is Pino)

### Previous Story Intelligence

**From Story 2.4 (completed):**
- All 123 tests passing (12 shared + 47 API + 64 web)
- Build succeeds: `pnpm build`
- `AppLayout` now passes `taskStore.tasks` (all tasks) to TaskList
- CSS transitions for completion animation work correctly
- No files in `apps/api/src/services/` yet — this is the first story to create that directory

**From Story 2.1 (completed):**
- Route pattern established in `tasks.ts`: Zod validation → Supabase query → schema validation → send
- `ErrorCode.enum.X` pattern for error codes (not string literals)
- `ApiSuccessSchema(dataSchema)` wrapper for success responses
- Server test pattern uses `buildServer()` + `fastify.inject()`

**From Epic 1 retrospective:**
- Build/packaging was the blind spot — verify `pnpm build` succeeds
- Use `toEqual` not `toBe` for state comparisons (Vitest)
- ESM imports must use `.js` extension (`import { foo } from './bar.js'`)

### Git Intelligence

Recent commits:
- `113f2ac feat: story 2.4 implemented and reviewed`
- `ba90a2d feat: story 2.3 implemented and reviewed`
- `5b4372a feat: story 2.2 implemented and reviewed`
- `d9688f7 feat: story 2.1 implemented and reviewed`

Last commit files touched — all in `apps/web/src/lib/components/` (frontend). This story is the first to create the API services layer.

### Key Technical Notes

**Zod to JSON Schema:** The `zod-to-json-schema` library handles the conversion of `ExtractionResultSchema` to the JSON Schema format required by both OpenRouter and LM Studio's `response_format` parameter. Use `zodToJsonSchema(ExtractionResultSchema, { target: 'openApi3' })` or similar.

**Fastify Pino logging:** Fastify ships with Pino. Use `request.log.info({ ... })` for structured logging — no need to import Pino separately. The log level is configured in `server.ts` as `logger: { level: 'info' }`.

**Rate limit plugin ordering:** `@fastify/rate-limit` registers an `onRequest` hook by default. Since `userId` is set by `authMiddleware` (a `preHandler`), the rate limiter's `keyGenerator` won't have access to `userId` at `onRequest` time. Override the hook to `preHandler` so it runs after auth: `hook: 'preHandler'`.

**HTTP status codes for extraction errors:**
- 408 for EXTRACTION_TIMEOUT (request timeout)
- 422 for EXTRACTION_VALIDATION_FAILED (unprocessable entity — LLM returned bad data)
- 502 for EXTRACTION_PROVIDER_ERROR (bad gateway — upstream LLM failed)
- 429 for RATE_LIMITED (too many requests)

### Import Order Convention

```typescript
// 1. External packages
import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

// 2. Monorepo packages
import { ErrorCode, ExtractionResultSchema, ExtractRequestSchema } from '@smart-todo/shared'

// 3. Local imports (relative)
import { createLLMProvider, ExtractionTimeoutError } from '../services/llm-provider.js'
```

### Null Handling Convention

All fields in `ExtractionResultSchema` are nullable (not optional). The LLM response must include explicit `null` for fields not extracted. If the LLM omits a field entirely, Zod validation will fail (fields are required, just nullable). This is by design — we want the strict contract.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — acceptance criteria, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — error codes, extraction timeout architecture, LLM structured output schema, provider abstraction
- [Source: _bmad-output/planning-artifacts/architecture.md#Security Hardening Requirements] — P1: per-user extraction rate limit 30 req/min
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — LLM Provider Abstraction interface
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, import order, error format
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — services/ directory, extract.ts route location
- [Source: packages/shared/src/schemas/extraction.ts] — ExtractionResultSchema (existing)
- [Source: packages/shared/src/schemas/api.ts] — ErrorCode enum with extraction codes (existing)
- [Source: apps/api/src/server.ts] — route registration pattern, auth preHandler hook
- [Source: apps/api/src/routes/tasks.ts] — route handler pattern, Zod validation, error response format
- [Source: apps/api/src/middleware/auth.ts] — JWT verification, request.userId injection
- [Source: apps/api/package.json] — @fastify/rate-limit already in dependencies
- [Source: _bmad-output/implementation-artifacts/2-4-task-completion-flow.md] — previous story learnings, test count baseline

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed ESLint import-x/order violations in llm-provider.ts and extract.ts (monorepo imports before type imports)
- Fixed shared package top-level index.ts missing ExtractRequestSchema re-export (caused TS2724 in API)
- Fixed Vitest instanceof checks failing across vi.resetModules() boundaries — switched to string-based error message matching

### Completion Notes List

- Created the LLM provider abstraction with `LLMProvider` interface, `ExtractionTimeoutError`/`ExtractionProviderError` custom error classes, factory function supporting `openrouter` and `lmstudio` providers, and a shared system prompt constant
- Implemented OpenRouter provider with JSON Schema structured output via `response_format`, `data_collection: 'deny'` for no-training policy (FR39), `require_parameters: true`, proper auth headers, and 4.5s AbortController timeout
- Implemented LM Studio provider with identical OpenAI-compatible request format minus auth headers and provider field
- Both providers send only raw text in the user message (FR38 privacy compliance)
- Added `ExtractRequestSchema` to shared package with `{ text: z.string().min(1) }` validation
- Created POST /api/extract route with full error handling: VALIDATION_ERROR (400), EXTRACTION_VALIDATION_FAILED (422), EXTRACTION_TIMEOUT (408), EXTRACTION_PROVIDER_ERROR (502)
- Every extraction attempt logged as structured Pino JSON: `{ event, status, duration_ms, model, provider }`
- Wired `@fastify/rate-limit` with `global: false`, `hook: 'preHandler'` (runs after auth), and route-specific config on `/api/extract` at 30 req/min per `request.userId`
- Added `zod-to-json-schema` dependency for converting ExtractionResultSchema to JSON Schema for the LLM response_format parameter
- Test count: 222 total (12 shared + 85 API + 125 web), up from 123 baseline — 38 new API tests added
- All quality gates pass: `pnpm lint` 0 errors, `pnpm typecheck` 0 errors, `pnpm test` all pass, `pnpm build` succeeds

### Change Log

- 2026-04-20: Story 2.5 implementation complete — LLM provider abstraction, extraction API, rate limiting, comprehensive tests

### File List

New files:
- apps/api/src/services/llm-provider.ts
- apps/api/src/services/llm-provider.test.ts
- apps/api/src/services/openrouter.ts
- apps/api/src/services/openrouter.test.ts
- apps/api/src/services/lm-studio.ts
- apps/api/src/services/lm-studio.test.ts
- apps/api/src/routes/extract.ts
- apps/api/src/routes/extract.test.ts

Modified files:
- apps/api/src/server.ts
- apps/api/package.json
- packages/shared/src/schemas/extraction.ts
- packages/shared/src/schemas/index.ts
- packages/shared/src/index.ts
- pnpm-lock.yaml
- _bmad-output/implementation-artifacts/sprint-status.yaml
