---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-15'
inputDocuments:
  - product-brief-todo-app-bmad-training-distillate.md
  - prd.md
  - prd-validation-report.md
  - ux-design-specification.md
  - research/domain-personal-task-management-nlp-research-2026-04-13.md
workflowType: 'architecture'
project_name: 'todo-app-bmad-training'
user_name: 'Tomasz'
date: '2026-04-15'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (44 FRs across 9 categories):**

The requirements describe a focused but technically nuanced product. The surface area is small — capture input, extraction form, task list, completed section, group filtering — but the interaction model places unusual demands on state management and error handling:

- **Authentication & Identity (FR1-4):** Passwordless magic link via Supabase. Server-enforced data isolation. Persistent sessions across browser closes.
- **Task Capture (FR5-13):** Natural language input, keyboard shortcut, persistent UI element. LLM-powered extraction into editable structured form. One-click save. Rapid sequential capture without navigation.
- **Graceful Degradation (FR14-17):** Manual form on 5s timeout or LLM failure. Title pre-populated from raw input. Same save action as extraction path. Optional client-side lightweight parsing as middle tier.
- **Task Organization (FR18-24):** Up to 3 user-created groups. Assign during capture or editing. Ungrouped default. Group filtering plus unified view. Priority-weighted default sort with due date tiebreaker.
- **Task Management (FR25-28):** View, edit, delete with recovery path (undo/confirmation/soft-delete).
- **Task Completion (FR29-32):** Mark/unmark complete. Visible completed list with growth management. Completed count.
- **Extraction Feedback (FR33-34):** Thumbs up/down with prominence transition over time.
- **First-Use Experience (FR35-36):** Empty state with suggested rich example for first-use revelation.
- **AI Transparency & System Config (FR37-43):** "Powered by AI" indicator. Data minimization. Provider abstraction (OpenRouter prod, LM Studio dev). Configuration-only switching. Server-side key management.

**Non-Functional Requirements (22 NFRs):**

These NFRs will drive the most consequential architectural decisions:

- **Performance:** LLM extraction ≤3s (p90) target, 5s hard timeout. FCP ≤1.5s, LCP ≤2.5s, TTI ≤3.0s, CLS ≤0.1. Lighthouse ≥90. Supabase query ≤500ms. These collectively demand a lightweight frontend framework and aggressive bundle optimization.
- **Security:** Passwordless auth via Supabase. API key isolation on backend proxy. No secrets in client. HTTPS everywhere. IP whitelisting for MVP validation.
- **Accessibility:** WCAG 2.1 AA as merge gate. Keyboard operability for complete capture-to-save flow. ARIA live regions for dynamic content. Focus management during extraction transitions. axe-core in CI.
- **Integration:** Supabase (auth + DB + RLS), OpenRouter (prod LLM), LM Studio (dev LLM). Provider abstraction through backend proxy.
- **Reliability:** Graceful degradation to manual form. Data durability via Supabase. Auth resilience for active sessions. Extraction independence — task creation succeeds even with LLM completely down.

**Scale & Complexity:**

- Primary domain: Full-stack web (SPA + backend proxy + BaaS)
- Complexity level: Medium
- Estimated architectural components: ~12-15 (SPA shell, capture input, extraction form, task list, task item, completed section, group filter, empty state, sync indicator, backend proxy, LLM service layer, Supabase client, auth flow, state management)

### Technical Constraints & Dependencies

| Constraint | Source | Architectural Impact |
|---|---|---|
| Supabase for auth + persistence | PRD (declared integration) | Database schema design, RLS policies, SDK integration in SPA, potential token verification in proxy |
| OpenRouter for production LLM | PRD (declared integration) | Backend proxy must route to OpenRouter API with structured output (JSON Schema), handle provider filtering (no-training) |
| LM Studio for development LLM | PRD (declared integration) | Backend proxy must abstract provider differences — config-only switching between OpenRouter and LM Studio |
| 5-second hard extraction timeout | PRD NFR | Backend proxy must enforce timeout independently of LLM provider response. Client must handle timeout transition to manual form. |
| No secrets in client code | PRD Security NFR | All LLM API keys and Supabase service role key (if used) must live in backend proxy environment |
| WCAG 2.1 AA from day one | PRD + UX spec | Component library must use accessible primitives. axe-core in CI pipeline. Affects every UI component. |
| FCP ≤1.5s, bundle performance | PRD + UX spec | Framework selection constrained toward lightweight options. Tailwind CSS purging essential. Self-hosted Inter font with `font-display: optional`. |
| Tailwind CSS + headless primitives | UX spec (design system choice) | Visual system built on utility classes + Radix/equivalent accessible primitives. No heavy component libraries. |
| Two breakpoints (mobile/desktop at 768px) | UX spec | CSS Grid responsive layout. Bottom-docked input on mobile, top-prominent on desktop. |
| Optimistic UI pattern | UX spec | State management must support local-first writes, background persistence, retry with exponential backoff (3 attempts: 5s/15s/30s) |
| Solo developer | PRD scoping | Architecture must be approachable for one person. No microservices. Minimize operational complexity. |
| UX spec's Radix primitive mapping | UX spec (component strategy) | Creates soft coupling to React ecosystem. Non-React frameworks require re-mapping all accessible primitive selections. Must be consciously accepted or rejected during framework selection. |
| Backend proxy is operationally thin | PRD (single extraction endpoint) | The proxy forwards one type of request. Technology choice is primarily an operational decision (deployment topology, solo-dev maintainability), not a technical capability decision. |
| Performance budget as framework eliminator | PRD + UX spec (FCP ≤1.5s) | Framework runtime >30KB gzipped significantly compresses the budget for product code. This is a hard constraint, not a weighted criterion. |

### Cross-Cutting Concerns Identified

1. **Authentication & Session Management** — Supabase auth touches every data operation (RLS enforcement), the backend proxy (token verification for extraction requests), and the SPA lifecycle (session persistence, iOS Safari token eviction risk).

2. **Graceful Degradation / Error Handling** — Three extraction paths (full, partial, manual) must converge to identical save flows. Supabase save failures must produce optimistic local state with retry. Auth failures must redirect gracefully. No error pages, no "something went wrong" messages.

3. **Accessibility** — Every component must ship with ARIA attributes, keyboard handlers, focus management, and screen reader announcements. This is not a layer added on top — it's woven into component architecture from the headless primitive selection.

4. **Performance Budget** — Framework choice, bundle splitting, font loading strategy, image optimization, and CSS purging all serve the FCP/LCP/TTI targets. Lighthouse ≥90 as CI gate.

5. **LLM Provider Abstraction** — The backend proxy must present a single extraction endpoint to the SPA while routing to OpenRouter (prod) or LM Studio (dev) based on environment config. Structured output schema enforcement, timeout management, and rate limiting are proxy responsibilities.

6. **Optimistic State Management** — Local-first task writes with background sync to Supabase. Retry logic, conflict handling, and sync status indicators (per-task dots, global banner when any task unsynced >60s). This pattern affects task creation, completion, editing, and deletion.

7. **Privacy & Data Flow** — Only raw task text sent to LLM. No user metadata, no task history, no group names in extraction calls. Provider filtering for no-training policies. Privacy policy disclosure requirements.

8. **Optimistic UI as Architectural Commitment** — Not a UI pattern but a data flow architecture. Every mutation (create, complete, edit, delete, group assign) must: write to local state immediately, persist pending mutations to localStorage, fire background API write, handle retry (3 attempts: 5s/15s/30s), track sync status per-task, show global banner when any task is unsynced >60s, auto-retry on reconnection, replay pending mutations from localStorage on page load, and handle server rejection with local rollback. This must be designed as a unified data layer, not implemented ad-hoc per feature.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application: Svelte 5 SPA + Fastify BFF API + Supabase (auth + database), deployed as Docker containers, managed as a TypeScript monorepo.

### SPA Framework Analysis

| Criterion | React 19 + Vite 7 | **Svelte 5 + Vite (selected)** |
|---|---|---|
| **Runtime size** | ~42-45KB gzipped | **~2-5KB gzipped** |
| **FCP budget impact** | Consumes ~50% before product code | **Negligible — massive headroom** |
| **Accessible primitives** | Radix UI | **Bits UI (Radix-inspired, WAI-ARIA)** |
| **Pre-styled accessible + Tailwind** | shadcn/ui | **shadcn-svelte (Bits UI + Tailwind)** |
| **Optimistic UI** | TanStack Query (~13KB) | **Svelte stores + custom sync (~0KB overhead)** |
| **Mental model complexity** | Hooks, dependency arrays, stale closures, re-render model | **Runes ($state, $derived, $effect), compile-time reactivity** |
| **Total estimated JS bundle** | ~125-150KB gzipped | **~65-90KB gzipped** |
| **Solo developer learning curve** | Steeper (more concepts, more footguns) | **Smaller API surface, fewer gotchas** |

### Selected Framework: Svelte 5 + Vite

**Rationale:**

1. **Performance headroom is comfortable, not tight.** With ~2-5KB runtime overhead, the FCP ≤1.5s and Lighthouse ≥90 targets are achievable without aggressive optimization.
2. **Simpler mental model for a solo developer learning from scratch.** Svelte 5's Runes (`$state`, `$derived`, `$effect`) provide clear, compile-time reactivity without hook rules and stale closure traps.
3. **Optimistic UI without a library.** Svelte's reactive stores handle local state naturally. The sync layer for API writes is ~50-80 lines of custom code — proportional to the problem.
4. **Bits UI + shadcn-svelte provide equivalent accessible primitives.** Bits UI is Radix-inspired, WAI-ARIA compliant, purpose-built for Svelte 5. The UX spec's Radix primitive mapping translates directly.
5. **No router overhead.** Single-view SPA. Svelte + Vite without SvelteKit avoids routing/SSR infrastructure entirely.

**Trade-off acknowledged:** Svelte's ecosystem is smaller. If the developer hits an obscure edge case, there are fewer community answers to draw from. For a ~10-component SPA with well-documented libraries (Bits UI, Supabase SDK, Tailwind), this risk is acceptable.

### System Boundary Decision: BFF Pattern

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Browser                                                 │
│                                                         │
│  Svelte SPA ──→ Supabase JS SDK (auth only)             │
│       │         - Magic link flow                       │
│       │         - Session management                    │
│       │         - Token refresh                         │
│       │         - onAuthStateChange                     │
│       │                                                 │
│       └──────→ Fastify BFF API (all data operations)    │
│                 - JWT verification middleware            │
│                 - Task CRUD                              │
│                 - Group management                       │
│                 - Extraction (→ OpenRouter / LM Studio)  │
│                 - Feedback collection                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Fastify BFF Container                                   │
│                                                         │
│  Auth middleware ──→ Verify Supabase JWT on every request│
│  Task routes    ──→ Supabase PostgreSQL (via SDK)       │
│  Extract route  ──→ OpenRouter (prod) / LM Studio (dev) │
│  All secrets    ──→ Environment variables only           │
└─────────────────────────────────────────────────────────┘
```

**Rationale:**

- **Auth stays client-side.** Supabase SDK handles magic link flows, session persistence, token refresh, and `onAuthStateChange` automatically. Re-implementing server-side is high cost, low value.
- **All data flows through the API.** Task CRUD, groups, completion, extraction, feedback — single backend for all data operations. The SPA's Supabase JWT is sent as a Bearer token; the API verifies it and queries the database with explicit user isolation.
- **Docker deployment simplified.** The SPA container (Nginx) needs only two runtime values: Supabase URL and Supabase anon key (both public, for auth SDK). No API URL needed — same-domain deployment with reverse proxy routing means the SPA uses relative `/api/*` paths. All sensitive secrets (Supabase service role key, OpenRouter API key) live exclusively in the API container.
- **FR4 compliance.** "Server-enforced data isolation" — the API middleware extracts `user_id` from the verified JWT and filters all queries explicitly. Auditable in your own code. Supabase RLS available as defense-in-depth.
- **Single error format.** The SPA handles one API response shape for all data operations, not two different error models from Supabase SDK and Fastify.

**API Endpoints (~12):**

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/tasks` | GET | List user's tasks (open + completed) |
| `/api/tasks` | POST | Create task (from extraction form or manual) |
| `/api/tasks/:id` | PATCH | Update task fields |
| `/api/tasks/:id` | DELETE | Delete task (soft-delete with recovery) |
| `/api/tasks/:id/complete` | POST | Mark task complete |
| `/api/tasks/:id/uncomplete` | POST | Return task to open |
| `/api/groups` | GET | List user's groups |
| `/api/groups` | POST | Create group (max 3 enforced server-side) |
| `/api/groups/:id` | PATCH | Rename group |
| `/api/extract` | POST | LLM extraction (→ OpenRouter / LM Studio) |
| `/api/feedback` | POST | Extraction quality feedback (thumbs up/down) |
| `/api/health` | GET | Health check for Docker orchestrator |

### Initialization Commands

```bash
# Scaffold monorepo
npx create-turbo@latest smart-todo --package-manager pnpm

# Inside apps/web — scaffold Svelte 5 SPA
npm create vite@latest apps/web -- --template svelte-ts

# Add Tailwind CSS v4
cd apps/web && pnpm add tailwindcss @tailwindcss/vite

# Add Bits UI (accessible headless primitives)
pnpm add bits-ui

# Add shadcn-svelte CLI for copy-paste Tailwind components
npx shadcn-svelte@latest init

# Add Supabase client (auth only in SPA)
pnpm add @supabase/supabase-js

# Add Zod for schema validation
pnpm add zod

# Inside apps/api — scaffold Fastify BFF
mkdir -p apps/api && cd apps/api
pnpm init
pnpm add fastify @fastify/rate-limit @supabase/supabase-js zod
pnpm add -D typescript @types/node tsx
```

### Monorepo Structure

```
smart-todo/
├── apps/
│   ├── web/                     # Svelte 5 + Vite SPA
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/  # UI components (shadcn-svelte based)
│   │   │   │   ├── stores/      # Svelte stores (task state, sync, auth)
│   │   │   │   ├── api.ts       # Typed API client (calls Fastify BFF)
│   │   │   │   ├── supabase.ts  # Supabase client (auth only)
│   │   │   │   └── utils/       # Helpers, formatters
│   │   │   └── App.svelte
│   │   ├── public/
│   │   │   └── config.json      # Runtime config (written by entrypoint.sh)
│   │   ├── docker/
│   │   │   └── entrypoint.sh    # Writes env vars to config.json at startup
│   │   ├── Dockerfile           # Multi-stage: build + Nginx static serve
│   │   └── vite.config.ts
│   └── api/                     # Fastify BFF
│       ├── src/
│       │   ├── routes/          # Task, group, extract, feedback routes
│       │   ├── middleware/      # JWT verification, rate limiting
│       │   ├── services/        # LLM provider abstraction, Supabase queries
│       │   └── server.ts
│       └── Dockerfile           # Node.js production image
├── packages/
│   ├── shared/                  # Zod schemas, shared types, constants
│   │   └── src/
│   │       ├── schemas/         # Task schema, extraction schema, API contracts
│   │       └── types/           # Shared TypeScript types
│   └── config/                  # Shared ESLint, TS configs
├── docker-compose.yml           # web (Nginx) + api (Node) + local dev config
├── turbo.json                   # Build/test/lint pipeline
├── pnpm-workspace.yaml          # Workspaces + minimumReleaseAge: 20160
└── package.json
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript (strict mode) across all packages
- Zod for runtime type validation and LLM extraction schema definition
- Svelte 5 with Runes for compile-time reactivity
- Node.js for Fastify BFF
- Shared TypeScript config in `packages/config/`

**Runtime Configuration (Docker):**
- SPA container: Nginx entrypoint script writes `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `/config.json` at container startup. The SPA fetches this on init before creating the Supabase auth client. Same image across all environments. No `API_URL` needed — same-domain deployment means the SPA uses relative `/api/*` paths.
- API container: All secrets (Supabase service role key, OpenRouter API key, LM Studio URL) as environment variables. Standard Docker practice.

**Styling Solution:**
- Tailwind CSS v4 (Oxide engine, CSS-first configuration)
- shadcn-svelte components (Bits UI + Tailwind, copy-paste into `lib/components/ui/`)
- Design tokens from UX spec mapped to Tailwind config
- `font-display: optional` for self-hosted Inter variable font

**State Management:**
- Svelte 5 Runes (`$state`, `$derived`, `$effect`) for reactive UI state
- Custom sync stores for optimistic API writes with retry logic
- Supabase `onAuthStateChange` for auth state — JWT passed to API as Bearer token

**Build Tooling:**
- Vite 7 for SPA build (HMR, tree-shaking, optimized production bundles)
- Turborepo for monorepo task orchestration (parallel builds, incremental caching)
- pnpm workspaces with `workspace:*` protocol
- Docker multi-stage builds for production images

**Testing Framework:**
- **Vitest** for unit and integration tests (native Vite integration, native TypeScript, 5x faster than Jest)
- **Playwright** for E2E tests
- `@testing-library/svelte` for component testing

**Code Quality:**
- ESLint 9 (Flat Config) with `@stylistic/eslint-plugin` for formatting
- TypeScript strict mode across all packages
- Shared ESLint and TS configs in `packages/config/`
- `pnpm-workspace.yaml` with `minimumReleaseAge: 20160` (14 days) — hard requirement

**Development Experience:**
- Vite HMR for instant frontend feedback
- `tsx` for Fastify development with watch mode
- Turborepo caching for fast monorepo builds
- Docker Compose for local full-stack development

**UX Spec Primitive Mapping (Radix → Bits UI):**

| UX Spec (Radix) | Svelte Equivalent (Bits UI) | Used In |
|---|---|---|
| Radix Checkbox | Bits UI Checkbox | TaskItem completion |
| Radix Dialog | Bits UI Dialog | PinPrompt (desktop) |
| Radix ToggleGroup | Bits UI ToggleGroup | GroupPillBar |
| Radix VisuallyHidden | Bits UI VisuallyHidden | ARIA live regions |
| Radix ScrollArea | Bits UI ScrollArea | TaskList overflow |

**`packages/shared` — The Type Contract:**
Zod schemas in `packages/shared` define the API contract between SPA and BFF. Both apps import the same schemas — request bodies validated by the API, response shapes typed in the SPA client. Single source of truth for the task model, extraction schema, and API payloads.

### Security Hardening Requirements

| Priority | Requirement | Implementation |
|---|---|---|
| **P0** | JWT verification via `supabase.auth.getUser()` | API middleware verifies every request by round-trip to Supabase. Cache verification result for 60s per token. Validate `exp`, `iss`, `aud` claims. On failure, return HTTP 401 with `{ error: { code: "UNAUTHORIZED", message: "..." } }` — same format as all other error responses. |
| **P0** | user_id from JWT only | Architectural rule: `user_id` is ONLY extracted from verified JWT payload, NEVER from request params/body. Enforced via integration tests. |
| **P0** | RLS deny-all for anon key | Supabase RLS policies deny all unauthenticated access. The API creates per-request clients with the user's JWT — RLS enforces `auth.uid() = user_id` for all data access. The service role key is reserved for admin operations only (e.g., email allowlist management). |
| **P0** | config.json no-cache | Nginx: `location /config.json { add_header Cache-Control "no-store"; }` |
| **P0** | HTTPS enforcement | Reverse proxy (Nginx/Traefik) terminates TLS in front of Docker stack. SPA redirects HTTP → HTTPS. |
| **P1** | Per-user extraction rate limit | `/api/extract` limited to 30 requests/minute per `user_id` from JWT. Prevents API cost abuse. |
| **P1** | JWT-based rate limiting | `@fastify/rate-limit` keyed by `user_id` from JWT, not IP. Avoids Docker network same-IP problem. |
| **P1** | Auth email allowlist | Supabase Auth restricted to allowlisted emails for 6-user MVP. Open registration disabled. |
| **P2** | Schema integrity tests | Unit tests in `packages/shared` assert Zod schema structure. CI gate prevents silent schema changes. |

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Database schema and migration approach
- Supabase access pattern (per-request client with user JWT + RLS)
- Same-domain deployment with reverse proxy routing
- Error response format and extraction timeout architecture
- LLM structured output schema (Zod in shared package)
- Svelte store architecture and optimistic UI pattern
- CI/CD pipeline gates

**Important Decisions (Shape Architecture):**
- Typed API client design
- Logging approach
- Docker Compose structure

**Deferred Decisions (Post-MVP):**
- Centralized logging / APM
- Horizontal scaling strategy
- CDN for static assets
- Database connection pooling
- API versioning

### Data Architecture

**Schema Management: Supabase Migrations (CLI)**

Versioned SQL migration files managed via `supabase migration new`, applied via `supabase db push` or CI. Migrations live in `supabase/migrations/` at the monorepo root. The schema is small (~3 tables) — an ORM adds unnecessary abstraction.

**Schema Drift Safeguard:** CI must run `supabase db diff` to detect divergence between migration files and the live database. Direct dashboard edits in production are prohibited — document this policy in the project README. This prevents silent schema corruption from manual hotfixes.

**Database Backup Policy:** Configure Supabase's built-in daily backups (available on paid plans) or schedule a periodic `pg_dump` via cron for self-hosted scenarios. No backup strategy was initially defined — at 6 users, data loss is reputationally catastrophic even if technically small.

**Core Data Model:**

| Table | Key Fields | Notes |
|---|---|---|
| `tasks` | id (uuid), user_id (uuid, FK → auth.users), title (text, NOT NULL), due_date (date), due_time (time), location (text), priority (enum: low/medium/high/urgent), group_id (uuid, FK → groups), is_completed (boolean), completed_at (timestamptz), deleted_at (timestamptz), created_at (timestamptz) | Soft-delete via `deleted_at` (FR28 recovery path). Priority as PostgreSQL enum. |
| `groups` | id (uuid), user_id (uuid, FK → auth.users), name (text, NOT NULL), created_at (timestamptz) | Max 3 per user enforced in API business logic. |
| `extraction_feedback` | id (uuid), user_id (uuid, FK → auth.users), task_id (uuid, FK → tasks), rating (enum: thumbs_up/thumbs_down), raw_input (text), extracted_fields (jsonb), created_at (timestamptz) | Telemetry for extraction quality analysis. |

**RLS Policies:**

| Table | Policy | Rule |
|---|---|---|
| `tasks` | Deny anon | No access via anon key |
| `tasks` | User isolation | `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE |
| `groups` | Deny anon | No access via anon key |
| `groups` | User isolation | `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE |
| `extraction_feedback` | Deny anon | No access via anon key |
| `extraction_feedback` | User isolation | `auth.uid() = user_id` for SELECT, INSERT |

**Caching Strategy:**

- JWT verification cache: 60s in-memory in API middleware (see trade-off note in Authentication section)
- Task list: SPA holds local state (Svelte stores) as working copy. API returns fresh data from Supabase.
- No Redis or external cache — unnecessary at 6-user scale

### Authentication & Security

**Same-Domain Deployment:**

The reverse proxy routes all traffic through a single domain:
- `/*` → Nginx container (SPA static files)
- `/api/*` → Fastify container (BFF)

This eliminates CORS entirely. The SPA calls `/api/tasks`, `/api/extract`, etc. as relative paths. No cross-origin configuration needed.

**Supabase Access Pattern: Per-Request Client with User JWT**

The API creates a Supabase client scoped to the user's JWT for each request. RLS policies enforce data isolation at the database level — defense-in-depth alongside the API's explicit user_id filtering.

```
Request flow:
SPA sends Authorization: Bearer <supabase_jwt>
  → API middleware verifies JWT via supabase.auth.getUser()
  → API creates per-request Supabase client with user's JWT
  → Supabase client queries database, RLS enforces user isolation
  → API returns response
```

The API container needs `SUPABASE_ANON_KEY` for creating per-request clients. `SUPABASE_SERVICE_ROLE_KEY` is available for admin operations (email allowlist management) but not used for normal data access.

**JWT Verification Cache Trade-off:** The 60-second cache on `supabase.auth.getUser()` results means a revoked session remains "valid" for up to 60s. This is an accepted trade-off for a 6-user personal productivity app — the alternative (verify every request) adds latency and Supabase API calls. Document this explicitly so future developers understand the window.

### API & Communication Patterns

**Error Response Format:**

```typescript
// Success: HTTP 2xx with typed response body
{ data: T }

// Error: HTTP 4xx/5xx
{
  error: {
    code: string,     // Machine-readable codes below
    message: string,  // Developer debugging only, never shown to users
  }
}
```

**Error Codes:**

| Code | Meaning | SPA Behavior |
|---|---|---|
| `VALIDATION_ERROR` | Request body failed Zod validation | Show field-level feedback |
| `NOT_FOUND` | Resource doesn't exist or user doesn't own it | Silent discard (optimistic rollback) |
| `RATE_LIMITED` | Per-user rate limit exceeded | Retry with backoff |
| `EXTRACTION_TIMEOUT` | LLM call exceeded 4.5s | Transition to manual form |
| `EXTRACTION_PROVIDER_ERROR` | LLM provider returned non-timeout error (auth, model deprecated, malformed response) | Transition to manual form, log via Pino |
| `EXTRACTION_VALIDATION_FAILED` | LLM response didn't match Zod schema | Transition to manual form, log via Pino |
| `UNAUTHORIZED` | JWT verification failed | Trigger token refresh, retry once, then redirect to login |
| `SERVER_ERROR` | Unhandled exception | Retry with backoff |

The SPA uses `error.code` to determine fallback behavior (manual form, sync dot, etc.) — per the UX spec's "no error states" philosophy. Distinguishing extraction failure modes (`TIMEOUT` vs `PROVIDER_ERROR` vs `VALIDATION_FAILED`) enables targeted logging and diagnostics.

**Extraction Endpoint Timeout Architecture:**

Dual timeout — belt and suspenders:
- **API-side:** 4.5s timeout on the outbound LLM request (leaving 500ms for proxy overhead). On timeout, returns `{ error: { code: "EXTRACTION_TIMEOUT" } }`.
- **Client-side:** 5s timeout on the fetch to `/api/extract`. If the API is slow for any reason, the SPA transitions to the manual form.

**Extraction Outcome Logging:** The API logs every extraction attempt with Pino (structured JSON): `{ event: "extraction", status: "success" | "timeout" | "provider_error" | "validation_failed", duration_ms, model, provider }`. Even without APM, these logs can be queried via `docker logs | jq`. If `extraction_feedback` shows zero `thumbs_up` entries in the last 24 hours while tasks are being created, extraction is silently broken.

**LLM Model Version Pinning:** Pin the specific model version in the API environment config (e.g., `OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct`) rather than using a provider default/latest. Prevents silent breakage when providers deprecate or swap models.

**LLM Structured Output Schema:**

Defined as Zod schema in `packages/shared`, used by both API (validation) and SPA (type inference):

```typescript
const ExtractionResultSchema = z.object({
  title: z.string(),
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

Fields are nullable, not optional — the LLM returns explicit `null` for fields it cannot extract. This supports the UX spec's "honest extraction" principle (empty fields over wrong guesses).

**Recurrence: Extracted but Not Stored in MVP.** The LLM extracts recurrence information and the extraction form displays it as read-only context for the user. However, the `tasks` table does not include recurrence columns — recurrence is a documented growth-phase feature. Implementing agents must not add recurrence fields to the database schema or task creation API in MVP.

**LLM Provider Abstraction:**

The API's extraction service abstracts the provider behind a common interface:

```typescript
interface LLMProvider {
  extract(text: string, schema: ZodSchema): Promise<ExtractionResult>
}
```

Implementation switches between OpenRouter (production) and LM Studio (development) based on the `LLM_PROVIDER` environment variable. Both use the same Zod schema for structured output validation. OpenRouter uses JSON Schema enforcement via `response_format`; LM Studio uses equivalent structured output APIs.

### Frontend Architecture

**Svelte Store Architecture:**

| Store | Responsibility | Key State |
|---|---|---|
| `authStore` | Supabase auth state, JWT for API calls, token refresh | `{ user, session, loading }` |
| `taskStore` | Active + completed tasks, optimistic mutations, sync tracking, pending mutation persistence | `{ tasks, completedTasks, syncStatus: Map<id, 'synced' \| 'pending' \| 'failed'>, pendingMutations: [] }` |
| `groupStore` | User's groups (max 3) | `{ groups }` |
| `captureStore` | Capture loop state machine | `{ state: 'idle' \| 'extracting' \| 'extracted' \| 'manual' \| 'saving', extractedFields, rawInput }` |

**Optimistic UI Resilience:**

The `taskStore` implements the optimistic UI pattern with persistence:
1. Write to local state immediately
2. Persist pending mutations to `localStorage` (survives page refresh and browser restart)
3. Fire API call in background
4. Track sync status per task
5. Retry on failure: 3 attempts at 5s/15s/30s
6. On page load: replay any pending mutations from `localStorage` before fetching fresh state
7. Show global sync banner when **any** task is unsynced for >60s (not just at 5+ count — a single lost task matters)
8. Auto-retry all pending mutations on reconnection (`navigator.onLine` + `online` event)
9. On server rejection: rollback local state + remove from `localStorage`

**JWT Token Refresh Handling:**

The `authStore` subscribes to Supabase `onAuthStateChange` for automatic token refresh. The API client reads `session.access_token` from the store at call time (not cached at initialization). On HTTP 401 from the API:
1. Call `supabase.auth.refreshSession()`
2. Retry the original request once with the new token
3. If refresh also fails, redirect to login

This prevents the "silent logout" scenario where a JWT expires mid-session and API calls fail without recovery.

**Typed API Client:**

A thin `fetch` wrapper in `lib/api.ts`:
- Reads JWT from `authStore` at call time (reactive — always current token)
- Adds `Authorization: Bearer <jwt>` to every request
- Calls relative `/api/*` paths (same domain)
- Validates responses against shared Zod schemas
- Handles 5s extraction timeout client-side
- Implements 401 retry with token refresh (one attempt)
- Returns typed results — no external HTTP library needed

**Bundle Optimization:**

With Svelte's ~2-5KB runtime, the performance budget has comfortable headroom:
- Tailwind CSS purging automatic with v4
- Inter variable font: self-hosted, `font-display: optional`, ~100KB (cached after first load)
- Supabase JS SDK (~25-30KB gzipped) is the largest dependency — used only for auth
- No code splitting for MVP — single-view app, total JS well within budget
- Lighthouse ≥90 enforced in CI as quality gate

### Infrastructure & Deployment

**Docker Compose Structure:**

```yaml
services:
  proxy:
    image: traefik  # or nginx as reverse proxy
    ports: ["443:443", "80:80"]
    # Routes /api/* → api, /* → web
  web:
    build: ./apps/web
    environment:
      - SUPABASE_URL
      - SUPABASE_ANON_KEY
  api:
    build: ./apps/api
    environment:
      - SUPABASE_URL
      - SUPABASE_ANON_KEY
      - SUPABASE_SERVICE_ROLE_KEY
      - OPENROUTER_API_KEY
      - OPENROUTER_MODEL
      - LM_STUDIO_URL
      - LLM_PROVIDER
```

No ports exposed on `web` or `api` containers — traffic flows exclusively through the reverse proxy. TLS termination at the proxy layer.

**Development vs Production Environments:**

Local development does NOT use Docker or the reverse proxy. Instead:
- `pnpm dev` runs both apps via Turborepo
- Vite's `server.proxy` configuration routes `/api/*` to the local Fastify server (e.g., `localhost:3001`) — transparent same-origin behavior during development
- No TLS, no containers, instant HMR feedback

Production uses the full Docker Compose stack with the reverse proxy. A separate `docker-compose.prod.yml` can override or extend the base config for production-specific settings (TLS certificates, resource limits, restart policies).

**CI/CD Pipeline (Turborepo):**

| Stage | Command | Gate |
|---|---|---|
| Lint | `turbo lint` | ESLint 9 zero errors |
| Type Check | `turbo typecheck` | TypeScript strict, zero errors |
| Unit Test | `turbo test` | Vitest, zero failures |
| Build | `turbo build` | Vite build + Fastify compile |
| Schema Drift | `supabase db diff` | No uncommitted schema changes |
| Accessibility | axe-core via Playwright | Zero WCAG 2.1 AA violations |
| E2E Test | `turbo test:e2e` | Playwright, zero failures |
| Lighthouse | Lighthouse CI | Score ≥90 |
| Docker Build | `docker compose build` | Images build successfully |

**Logging:**
- Fastify: Pino (built-in, JSON structured). Log level via environment variable. Extraction outcomes logged with status, duration, model, and provider for diagnostics.
- SPA: `console.error` for unexpected states during development. No production logging library.
- Docker container logs (`docker logs`) sufficient at MVP scale.

**Monitoring:**
- `/api/health` endpoint for Docker orchestrator health checks
- Extraction quality tracked via `extraction_feedback` table, queryable from Supabase dashboard
- Extraction success rate observable via Pino logs (`docker logs api | jq 'select(.event == "extraction")'`)
- No APM, Prometheus, or Grafana for MVP

### Decision Impact Analysis

**Implementation Sequence:**

1. Monorepo scaffold (Turborepo + pnpm) + Docker Compose skeleton
2. Supabase project setup + migrations (schema + RLS policies)
3. Fastify BFF with auth middleware + health endpoint
4. Svelte SPA shell with auth flow (Supabase SDK)
5. Task CRUD (API routes → Supabase, SPA stores → API client)
6. LLM extraction (API provider abstraction → OpenRouter/LM Studio)
7. Capture loop UI (extraction form, graceful degradation)
8. Task organization (groups, temporal sorting, completed section)
9. Polish (empty state, pin prompt, feedback, accessibility audit)

**Cross-Component Dependencies:**

- `packages/shared` Zod schemas must be defined before API routes or SPA client
- Supabase migrations must run before API can access data
- Auth middleware must work before any protected route
- Extraction service depends on LLM provider configuration
- Optimistic UI in taskStore depends on typed API client

### Pre-mortem Analysis Summary

A structured pre-mortem identified six failure scenarios. The following mitigations have been integrated into the decisions above:

| # | Failure Scenario | Severity | Mitigation Integrated Into |
|---|---|---|---|
| 1 | Schema drift from manual Supabase edits | High | Data Architecture: drift detection in CI, no-dashboard-edits policy, backup policy |
| 2 | Zombie sessions after JWT revocation | Low | Authentication: documented 60s cache trade-off |
| 3 | Silent extraction breakage (provider change) | High | API Patterns: differentiated error codes, extraction outcome logging, model version pinning |
| 4 | Optimistic mutations lost on page refresh | High | Frontend: localStorage persistence for pending mutations, replay on load, lowered banner threshold |
| 5 | Local dev environment undefined | Medium | Infrastructure: Vite proxy for dev, separate from Docker production stack |
| 6 | Silent logout from JWT refresh failure | High | Frontend: call-time token read, 401 retry with refresh, explicit redirect on failure |

## Implementation Patterns & Consistency Rules

### Naming Conventions

**Database (PostgreSQL):**

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `tasks`, `groups`, `extraction_feedback` |
| Columns | snake_case | `user_id`, `due_date`, `created_at`, `is_completed` |
| Foreign keys | `{referenced_table_singular}_id` | `user_id`, `group_id`, `task_id` |
| Indexes | `idx_{table}_{columns}` | `idx_tasks_user_id`, `idx_tasks_user_id_group_id` |
| Enums | snake_case type, snake_case values | `task_priority` → `low`, `medium`, `high`, `urgent` |
| RLS policies | `{table}_{action_description}` | `tasks_deny_anon`, `tasks_user_isolation` |

**API JSON (camelCase with boundary transform):**

| Element | Convention | Example |
|---|---|---|
| Request/response fields | camelCase | `dueDate`, `dueTime`, `groupId`, `isCompleted` |
| Error codes | SCREAMING_SNAKE_CASE | `VALIDATION_ERROR`, `EXTRACTION_TIMEOUT` |
| URL paths | kebab-case, plural nouns | `/api/tasks`, `/api/groups`, `/api/extract` |
| URL parameters | camelCase | `:id` (single resource identifier) |
| Query parameters | camelCase | `?groupId=...`, `?isCompleted=true` |

**Transform Rule:** A utility pair (`snakeToCamel` / `camelToSnake`) in `apps/api/src/utils/transform.ts` handles the database ↔ API boundary. Transform runs **before** Zod validation on the response path (database row → camelCase object → Zod parse → send). On the request path: receive → Zod parse (camelCase) → transform to snake_case → database write.

**TypeScript / Svelte:**

| Element | Convention | Example |
|---|---|---|
| Variables, functions | camelCase | `getUserTasks`, `syncStatus`, `handleSubmit` |
| Types, interfaces | PascalCase | `Task`, `ExtractionResult`, `ApiError` |
| Zod schemas | PascalCase + `Schema` | `TaskSchema`, `CreateTaskRequestSchema` |
| Svelte components | PascalCase `.svelte` | `TaskItem.svelte`, `CaptureInput.svelte` |
| Non-component files | kebab-case `.ts` | `api.ts`, `task-store.ts`, `auth-store.svelte.ts` |
| Store files | kebab-case + `.svelte.ts` | `task-store.svelte.ts`, `auth-store.svelte.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_GROUPS`, `EXTRACTION_TIMEOUT_MS` |
| Env variables | SCREAMING_SNAKE_CASE | `SUPABASE_URL`, `LLM_PROVIDER` |
| Callback props | `on` prefix | `onComplete`, `onDelete`, `onSave` |

### Schema Ownership Rules

| Location | Contains | Example |
|---|---|---|
| `packages/shared/src/schemas/` | Types that cross the API boundary | `TaskSchema`, `GroupSchema`, `ExtractionResultSchema`, API request/response shapes |
| `apps/api/src/schemas/` | API-internal validation | `CreateTaskRequestSchema` (with max-length, business constraints) |
| `apps/web/src/lib/types/` | SPA-internal types | `SyncStatus`, `CaptureState`, UI-only state shapes |

**Rule:** `packages/shared` contains **only** types consumed by both SPA and API. Internal types stay local to their app.

### Structure Patterns

**Test Location: Co-located**

```
lib/stores/task-store.svelte.ts
lib/stores/task-store.test.ts        ← right next to the source
lib/components/TaskItem.svelte
lib/components/TaskItem.test.ts      ← right next to the source
```

**Build Exclusion:** Each app's `tsconfig.json` must explicitly exclude test files from the production build:

```json
{
  "exclude": ["**/*.test.ts", "**/*.test.svelte"]
}
```

Vitest's config includes them. This prevents accidental test file bundling.

**Component Organization: By Type**

```
apps/web/src/lib/
├── components/
│   ├── ui/               # shadcn-svelte primitives (Button, Dialog, Checkbox, etc.)
│   ├── CaptureInput.svelte
│   ├── ExtractionForm.svelte
│   ├── TaskItem.svelte
│   ├── TaskList.svelte
│   ├── GroupPillBar.svelte
│   ├── CompletedSection.svelte
│   ├── EmptyState.svelte
│   ├── SyncIndicator.svelte
│   └── PinPrompt.svelte
├── stores/
│   ├── auth-store.svelte.ts
│   ├── task-store.svelte.ts
│   ├── group-store.svelte.ts
│   └── capture-store.svelte.ts
├── api.ts                # Typed API client
├── supabase.ts           # Supabase auth client
├── types/                # SPA-internal types
└── utils/                # Formatters, helpers
```

### Format Patterns

**Date/Time in JSON:** Always ISO 8601 strings. Formatting for display happens in the SPA only, never in the API.

| Type | JSON Format | Example |
|---|---|---|
| Date | `YYYY-MM-DD` | `"2026-04-15"` |
| Time | `HH:mm` | `"14:30"` |
| Timestamp | ISO 8601 with timezone | `"2026-04-15T14:30:00Z"` |

**Null Handling:** Explicit `null`, never omit fields. Every field defined in the Zod schema is always present in the response. `null` means "not set." This matches the nullable (not optional) Zod schema design.

**ID Format:** All IDs are `uuid`, generated by the database (`gen_random_uuid()`), never by application code.

**API Client Return Type:**

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }
```

The typed API client in `lib/api.ts` is the **single place** that parses HTTP responses into this shape. No other code checks HTTP status codes directly. Every API call goes through the client.

### Svelte Reactivity Patterns

**$effect() Allowlist:**

`$effect()` is restricted to synchronization. Approved use cases:

1. Persist `pendingMutations` to `localStorage` when they change
2. Subscribe to `supabase.auth.onAuthStateChange` for session updates
3. Update document title based on state
4. Sync `navigator.onLine` status to a reactive variable

Any other `$effect()` usage requires explicit justification. Data fetching, mutations, and API calls must use explicit function calls triggered by user actions.

**Component File Structure:**

```svelte
<script lang="ts">
  // 1. Props (using $props())
  // 2. Local state ($state, $derived)
  // 3. Store subscriptions
  // 4. Functions (event handlers, helpers)
</script>

<!-- Template -->

<style>
  /* Only if Tailwind classes are insufficient (animations, complex selectors) */
</style>
```

**Props Pattern:**

```typescript
let { task, onComplete, onDelete }: {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
} = $props()
```

Callback props use `on` prefix. No custom Svelte events — plain callback functions passed as props.

**State Representation:**

| Context | Pattern | Example |
|---|---|---|
| Stores with multiple states | Status enum | `captureStore.state: 'idle' \| 'extracting' \| 'extracted' \| 'manual' \| 'saving'` |
| Per-item status | Map with enum values | `syncStatus: Map<id, 'synced' \| 'pending' \| 'failed'>` |
| Simple async in templates | Svelte `{#await}` | No manual loading boolean needed |

### Process Patterns

**Validation Timing:**

| Where | What | How |
|---|---|---|
| SPA (before send) | UX convenience only | Zod `.safeParse()` — fast feedback, not authoritative |
| API (on receive) | Authoritative validation | Zod `.parse()` on request body from `packages/shared` schemas |
| API (before DB) | Business rules | Max 3 groups, user owns resource, title non-empty, etc. |

**Import Order:**

```typescript
// 1. External packages
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// 2. Monorepo packages
import { TaskSchema } from '@smart-todo/shared'

// 3. Local imports (relative)
import { authStore } from '../stores/auth-store.svelte'
import { formatDate } from '../utils/format'
```

Enforced by ESLint `import/order` rule.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use the naming conventions above without exception
- Place shared types only in `packages/shared` if consumed by both apps
- Route all API calls through the typed client (`lib/api.ts`)
- Use the `snakeToCamel` / `camelToSnake` utilities at the API boundary
- Follow the `$effect()` allowlist — justify any new use case
- Include `tsconfig.json` exclude for test files in every app

**Pattern Enforcement:**
- ESLint rules enforce import order and naming conventions
- TypeScript strict mode catches type mismatches between layers
- Zod `.parse()` at the API boundary catches any snake/camelCase transform gaps at runtime
- CI pipeline runs lint + typecheck + tests — pattern violations fail the build

### Self-Consistency Validation Summary

A cross-layer consistency check identified 6 areas where patterns could contradict or leave gaps. All have been addressed:

| # | Check | Resolution |
|---|---|---|
| 1 | snake_case ↔ camelCase transform location | Explicit utility in `apps/api/src/utils/transform.ts`, ordered before Zod validation |
| 2 | Shared vs local schema boundary | Rule: `packages/shared` = API boundary types only |
| 3 | Error response handling in SPA | `ApiResult<T>` discriminated union as single pattern |
| 4 | $effect() vs localStorage sync | Explicit allowlist of approved synchronization use cases |
| 5 | Co-located tests in production build | `tsconfig.json` exclude rule for test files |
| 6 | API_URL in runtime config | Removed — same-domain deployment uses relative paths |

## Project Structure & Boundaries

### Complete Project Directory Structure

```
smart-todo/
├── .github/
│   └── workflows/
│       └── ci.yml                          # CI pipeline (lint → typecheck → test → build → a11y → e2e → lighthouse → docker)
├── apps/
│   ├── web/                                # Svelte 5 + Vite SPA
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/
│   │   │   │   │   ├── ui/                 # shadcn-svelte primitives (copied via CLI)
│   │   │   │   │   │   ├── button/
│   │   │   │   │   │   ├── checkbox/
│   │   │   │   │   │   ├── dialog/
│   │   │   │   │   │   ├── toggle-group/
│   │   │   │   │   │   ├── scroll-area/
│   │   │   │   │   │   └── visually-hidden/
│   │   │   │   │   ├── AppLayout.svelte             # Two-region layout (capture + tasks), floating elements
│   │   │   │   │   ├── AppLayout.test.ts
│   │   │   │   │   ├── CaptureInput.svelte          # FR5-9: Natural language input, keyboard shortcut, persistent UI
│   │   │   │   │   ├── CaptureInput.test.ts
│   │   │   │   │   ├── ExtractionForm.svelte         # FR10-17: Editable structured form — handles both extraction and manual mode
│   │   │   │   │   ├── ExtractionForm.test.ts
│   │   │   │   │   ├── TaskItem.svelte               # FR25-28: View, edit, delete with recovery
│   │   │   │   │   ├── TaskItem.test.ts
│   │   │   │   │   ├── TaskList.svelte               # FR18-24: Group filtering, priority sort, due date tiebreaker
│   │   │   │   │   ├── TaskList.test.ts
│   │   │   │   │   ├── CompletedSection.svelte       # FR29-32: Completed list, mark/unmark, count
│   │   │   │   │   ├── CompletedSection.test.ts
│   │   │   │   │   ├── GroupPillBar.svelte           # FR18-21: Group creation, assignment, filtering
│   │   │   │   │   ├── GroupPillBar.test.ts
│   │   │   │   │   ├── EmptyState.svelte             # FR35-36: First-use experience, suggested example
│   │   │   │   │   ├── EmptyState.test.ts
│   │   │   │   │   ├── FeedbackButton.svelte         # FR33-34: Thumbs up/down with prominence transition
│   │   │   │   │   ├── FeedbackButton.test.ts
│   │   │   │   │   ├── SyncIndicator.svelte          # Optimistic UI: per-task dots, global banner
│   │   │   │   │   ├── SyncIndicator.test.ts
│   │   │   │   │   ├── PinPrompt.svelte              # UX: Desktop dialog for home screen prompt
│   │   │   │   │   ├── PinPrompt.test.ts
│   │   │   │   │   └── AiIndicator.svelte            # FR37: "Powered by AI" transparency indicator
│   │   │   │   ├── stores/
│   │   │   │   │   ├── auth-store.svelte.ts          # FR1-4: Auth state, JWT, session persistence
│   │   │   │   │   ├── auth-store.test.ts
│   │   │   │   │   ├── task-store.svelte.ts          # Task CRUD, optimistic mutations, localStorage persistence
│   │   │   │   │   ├── task-store.test.ts
│   │   │   │   │   ├── group-store.svelte.ts         # FR18-21: Group state (max 3)
│   │   │   │   │   ├── group-store.test.ts
│   │   │   │   │   ├── capture-store.svelte.ts       # Capture loop state machine
│   │   │   │   │   └── capture-store.test.ts
│   │   │   │   ├── api.ts                            # Typed API client (ApiResult<T>, 401 retry, Zod validation)
│   │   │   │   ├── api.test.ts
│   │   │   │   ├── config.ts                         # loadConfig() on init, getConfig() synchronous getter
│   │   │   │   ├── supabase.ts                       # Supabase client (auth only, reads from getConfig())
│   │   │   │   ├── types/                            # SPA-internal types
│   │   │   │   │   └── index.ts                      # SyncStatus, CaptureState, UI-only types
│   │   │   │   └── utils/
│   │   │   │       ├── format.ts                     # Date/time display formatters (ISO → locale)
│   │   │   │       └── format.test.ts
│   │   │   ├── App.svelte                            # Auth gate only: renders AppLayout or login
│   │   │   ├── app.css                               # Tailwind directives, Inter font @font-face, design tokens
│   │   │   └── main.ts                               # Entry: loadConfig() → mount App
│   │   ├── public/
│   │   │   ├── config.json                           # Runtime config (written by entrypoint.sh in Docker)
│   │   │   └── fonts/
│   │   │       └── inter-variable.woff2              # Self-hosted Inter variable font
│   │   ├── docker/
│   │   │   ├── entrypoint.sh                         # Writes SUPABASE_URL + SUPABASE_ANON_KEY to config.json
│   │   │   └── nginx.conf                            # Static file serving, config.json no-cache header
│   │   ├── Dockerfile                                # Multi-stage: node build → nginx serve
│   │   ├── index.html
│   │   ├── vite.config.ts                            # Vite config + dev proxy: /api/* → localhost:3001
│   │   ├── svelte.config.js
│   │   ├── tsconfig.json                             # Strict mode, excludes **/*.test.ts
│   │   ├── vitest.config.ts
│   │   └── package.json
│   └── api/                                          # Fastify BFF
│       ├── src/
│       │   ├── routes/
│       │   │   ├── tasks.ts                          # All task endpoints: GET/POST/PATCH/DELETE + complete/uncomplete
│       │   │   ├── tasks.test.ts
│       │   │   ├── groups.ts                         # GET/POST /api/groups, PATCH /api/groups/:id
│       │   │   ├── groups.test.ts
│       │   │   ├── extract.ts                        # POST /api/extract (LLM extraction with 4.5s timeout)
│       │   │   ├── extract.test.ts
│       │   │   ├── feedback.ts                       # POST /api/feedback (extraction quality)
│       │   │   ├── feedback.test.ts
│       │   │   └── health.ts                         # GET /api/health (Docker health check)
│       │   ├── middleware/
│       │   │   ├── auth.ts                           # JWT verification via supabase.auth.getUser(), 60s cache
│       │   │   └── auth.test.ts
│       │   ├── services/
│       │   │   ├── llm-provider.ts                   # LLMProvider interface + factory (OpenRouter / LM Studio)
│       │   │   ├── llm-provider.test.ts
│       │   │   ├── openrouter.ts                     # OpenRouter implementation with response_format
│       │   │   ├── openrouter.test.ts
│       │   │   ├── lm-studio.ts                      # LM Studio implementation for local dev
│       │   │   └── lm-studio.test.ts
│       │   ├── utils/
│       │   │   ├── transform.ts                      # snakeToCamel / camelToSnake boundary transform
│       │   │   ├── transform.test.ts
│       │   │   ├── supabase.ts                       # Per-request Supabase client factory (user JWT scoped)
│       │   │   └── supabase.test.ts
│       │   ├── schemas/                              # API-internal validation schemas
│       │   │   └── index.ts                          # CreateTaskRequest, UpdateTaskRequest (with business constraints)
│       │   └── server.ts                             # Fastify setup, plugin registration, route mounting
│       ├── .env.example                              # All required env vars documented for local dev
│       ├── Dockerfile                                # Node.js production image
│       ├── tsconfig.json                             # Strict mode, excludes **/*.test.ts
│       ├── vitest.config.ts
│       └── package.json
├── packages/
│   ├── shared/                                       # API boundary contract — package name: @smart-todo/shared
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   │   ├── task.ts                           # TaskSchema, task-related Zod schemas
│   │   │   │   ├── group.ts                          # GroupSchema
│   │   │   │   ├── extraction.ts                     # ExtractionResultSchema (nullable fields)
│   │   │   │   ├── api.ts                            # API response wrappers, error code enum
│   │   │   │   └── index.ts                          # Re-exports
│   │   │   ├── types/
│   │   │   │   └── index.ts                          # Inferred types from Zod schemas (z.infer<>)
│   │   │   └── index.ts                              # Package entry point
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── config/                                       # Shared tooling configs — package name: @smart-todo/config
│       ├── eslint/
│       │   └── base.js                               # ESLint 9 flat config with import/order
│       ├── typescript/
│       │   └── base.json                             # Shared tsconfig with strict mode
│       └── package.json
├── supabase/
│   ├── migrations/                                   # Versioned SQL migrations (supabase migration new)
│   │   └── 00000000000000_initial.sql                # tasks, groups, extraction_feedback tables + RLS
│   ├── seed.sql                                      # Dev seed data (optional)
│   └── config.toml                                   # Supabase project config
├── e2e/                                              # E2E tests — package name: @smart-todo/e2e
│   ├── tests/
│   │   ├── auth.spec.ts                              # Magic link login flow
│   │   ├── capture.spec.ts                           # Full capture loop: input → extraction → form → save
│   │   ├── tasks.spec.ts                             # Task CRUD, completion, deletion with recovery
│   │   ├── groups.spec.ts                            # Group creation, assignment, filtering
│   │   └── accessibility.spec.ts                     # axe-core WCAG 2.1 AA scan
│   ├── fixtures/
│   │   └── test-data.ts                              # Shared test data
│   ├── playwright.config.ts                          # Includes webServer config to start SPA + API
│   └── package.json
├── docker-compose.yml                                # Production: proxy + web + api
├── docker-compose.dev.yml                            # Override for local Docker testing (optional)
├── turbo.json                                        # Pipeline: lint, typecheck, test, build, test:e2e
├── pnpm-workspace.yaml                               # Workspaces (apps/*, packages/*, e2e) + minimumReleaseAge: 20160
#
# Workspace package names (set in each package.json "name" field):
#   apps/web      → @smart-todo/web
#   apps/api      → @smart-todo/api
#   packages/shared → @smart-todo/shared
#   packages/config → @smart-todo/config
#   e2e           → @smart-todo/e2e
├── package.json                                      # Root scripts
├── .gitignore
├── .env.example                                      # Docker Compose env vars (production)
└── README.md                                         # Local dev setup + production deployment

```

### Architectural Boundaries

**API Boundary (Fastify BFF):**

All data flows through `/api/*`. The SPA never queries Supabase directly for data.

```
SPA (Svelte)                    API (Fastify)                  Database (Supabase)
─────────────                   ─────────────                  ──────────────────
lib/api.ts ──── /api/* ────→ routes/*.ts ──── SDK ────→ PostgreSQL + RLS
lib/supabase.ts ─── auth ──→ Supabase Auth (direct, no API intermediary)
```

| Boundary | What Crosses | What Doesn't |
|---|---|---|
| SPA → API | Task CRUD, group ops, extraction, feedback | Auth flows (handled by Supabase SDK directly) |
| API → Supabase | Per-request client with user JWT, SQL queries via SDK | Service role key used only for admin ops |
| API → LLM | Raw task text only | User metadata, task history, group names (FR38-40 privacy) |
| SPA → Supabase Auth | Magic link, session refresh, onAuthStateChange | Data queries (all through API) |

**Component Boundaries (SPA):**

```
App.svelte (auth gate only)
└── AppLayout.svelte (layout shell, floating elements)
    ├── CaptureInput → captureStore → api.ts → /api/extract, /api/tasks
    ├── ExtractionForm → captureStore → api.ts → /api/tasks
    │   (handles both extraction result mode and manual fallback mode)
    ├── TaskList
    │   └── TaskItem → taskStore → api.ts → /api/tasks/:id
    ├── GroupPillBar → groupStore → api.ts → /api/groups
    ├── CompletedSection
    │   └── TaskItem → taskStore → api.ts → /api/tasks/:id
    ├── EmptyState (no store, static)
    ├── SyncIndicator → taskStore (read-only)
    ├── FeedbackButton → api.ts → /api/feedback
    ├── AiIndicator (no store, static)
    └── PinPrompt (no store, local dismiss state)
```

Components communicate **only** through stores and callback props. No direct component-to-component communication. No global event bus.

**AppLayout Conditional Rendering (driven by `captureStore.state`):**

| captureStore.state | Visible Components |
|---|---|
| `idle` | CaptureInput, TaskList (or EmptyState if no tasks), GroupPillBar, CompletedSection |
| `extracting` | CaptureInput (disabled/loading), TaskList, GroupPillBar, CompletedSection |
| `extracted` | ExtractionForm (with extracted fields), TaskList, GroupPillBar, CompletedSection |
| `manual` | ExtractionForm (empty fields, rawInput as title), TaskList, GroupPillBar, CompletedSection |
| `saving` | ExtractionForm (disabled/saving), TaskList, GroupPillBar, CompletedSection |

CaptureInput and ExtractionForm occupy the same capture region — they swap based on state. The task region (TaskList, GroupPillBar, CompletedSection) is always visible. SyncIndicator, AiIndicator, and PinPrompt render independently of captureStore state.

**Data Boundary (Transform Layer):**

```
PostgreSQL (snake_case) ←→ transform.ts ←→ Zod (camelCase) ←→ JSON response (camelCase)
                                ↑
                    apps/api/src/utils/transform.ts
```

**Config Initialization Chain:**

```
main.ts → loadConfig() → fetches /config.json → stores module-level
                                                      ↓
supabase.ts → getConfig() → reads SUPABASE_URL, SUPABASE_ANON_KEY (synchronous)
api.ts → uses relative /api/* paths (no config needed)
```

### Requirements to Structure Mapping

**FR1-4 (Authentication & Identity):**
- `apps/web/src/lib/supabase.ts` — Supabase auth client
- `apps/web/src/lib/stores/auth-store.svelte.ts` — Session state, JWT, onAuthStateChange
- `apps/api/src/middleware/auth.ts` — JWT verification, user_id extraction
- `supabase/migrations/*` — RLS policies for data isolation

**FR5-17 (Task Capture, Extraction & Graceful Degradation):**
- `apps/web/src/lib/components/CaptureInput.svelte` — Natural language input
- `apps/web/src/lib/components/ExtractionForm.svelte` — Handles both LLM-populated and manual modes
- `apps/web/src/lib/stores/capture-store.svelte.ts` — State machine: idle → extracting → extracted/manual → saving
- `apps/web/src/lib/api.ts` — 5s client-side timeout on extraction
- `apps/api/src/routes/extract.ts` — POST /api/extract with 4.5s LLM timeout
- `apps/api/src/services/llm-provider.ts` — Provider abstraction
- `packages/shared/src/schemas/extraction.ts` — ExtractionResultSchema

**FR18-24 (Task Organization):**
- `apps/web/src/lib/components/GroupPillBar.svelte` — Group management UI
- `apps/web/src/lib/components/TaskList.svelte` — Sorting, filtering
- `apps/web/src/lib/stores/group-store.svelte.ts` — Group state
- `apps/api/src/routes/groups.ts` — Group CRUD (max 3 enforcement)

**FR25-32 (Task Management & Completion):**
- `apps/web/src/lib/components/TaskItem.svelte` — View, edit, delete, complete/uncomplete
- `apps/web/src/lib/components/CompletedSection.svelte` — Completed list
- `apps/web/src/lib/stores/task-store.svelte.ts` — Optimistic mutations with localStorage persistence
- `apps/api/src/routes/tasks.ts` — All task endpoints (CRUD + complete/uncomplete)

**FR33-36 (Feedback & First-Use):**
- `apps/web/src/lib/components/FeedbackButton.svelte` — Thumbs up/down
- `apps/web/src/lib/components/EmptyState.svelte` — Empty state with example
- `apps/api/src/routes/feedback.ts` — POST /api/feedback

**FR37-43 (AI Transparency & System Config):**
- `apps/web/src/lib/components/AiIndicator.svelte` — "Powered by AI"
- `apps/api/src/services/openrouter.ts` — no-training provider filtering
- `apps/api/src/services/llm-provider.ts` — Provider switching via env var

**Cross-Cutting Concerns Mapping:**

| Concern | Files |
|---|---|
| Optimistic UI + Sync | `task-store.svelte.ts`, `SyncIndicator.svelte`, `api.ts` |
| Accessibility | All `components/ui/*` (Bits UI), `e2e/tests/accessibility.spec.ts` |
| Performance budget | `vite.config.ts` (build), `.github/workflows/ci.yml` (Lighthouse gate) |
| Type contract | `packages/shared/src/schemas/*` — single source of truth |
| Error handling | `api.ts` (ApiResult), `apps/api/src/routes/*` (error codes) |
| Privacy | `apps/api/src/services/llm-provider.ts` (only raw text sent to LLM) |

### Development Workflow

**Local Development (no Docker):**

```bash
pnpm dev                    # Turborepo runs both apps in parallel
# apps/web: Vite dev server on :5173, proxies /api/* → :3001
# apps/api: tsx watch mode on :3001
# Supabase: local via `supabase start` or remote project
pnpm lighthouse             # Build web app, serve, run Lighthouse CI audit (fails if Performance < 90)
```

**Production Deployment (Docker):**

```bash
docker compose build        # Builds web (nginx) + api (node) images
docker compose up           # Starts proxy + web + api
# Proxy routes /* → web, /api/* → api
# TLS termination at proxy layer
```

### Critical Perspective Review Summary

A structural review identified 6 issues. All have been resolved:

| # | Issue | Resolution |
|---|---|---|
| 1 | ManualForm duplicated ExtractionForm | Removed — ExtractionForm handles both modes via `extractedFields` prop |
| 2 | tasks-complete.ts unnecessary split | Merged into tasks.ts — all task mutations in one file |
| 3 | No config.ts for runtime config | Added `lib/config.ts` with `loadConfig()` / `getConfig()` |
| 4 | E2E tests not a workspace member | Added to pnpm-workspace.yaml as `@smart-todo/e2e`, Playwright webServer configured |
| 5 | App.svelte would become god component | Added AppLayout.svelte — auth gate separated from layout |
| 6 | No per-app .env.example | Added `apps/api/.env.example`, root `.env.example` for Docker Compose |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices verified compatible. Svelte 5 + Vite + Bits UI + shadcn-svelte + Tailwind CSS v4 form a coherent frontend stack. Fastify + @supabase/supabase-js + Zod form a coherent API stack. Turborepo + pnpm workspaces manage the monorepo cleanly. Same-domain deployment eliminates CORS — consistent with the API client using relative paths. Three stale references were found and corrected during validation (RLS P0 description, @fastify/cors in init commands, sync banner threshold).

**Pattern Consistency:** Naming conventions span all layers consistently (snake_case DB → camelCase API → camelCase TypeScript). Schema ownership rules prevent shared/local confusion. The $effect() allowlist aligns with store architecture. Transform ordering (before Zod validation) is explicit.

**Structure Alignment:** The Step 6 project tree accounts for every architectural decision. Component boundaries, data boundaries, and config initialization chains are all documented with explicit file paths.

### Requirements Coverage ✅

**Functional Requirements (44 FRs across 9 categories):** All covered.

| FR Category | Architectural Support |
|---|---|
| FR1-4: Auth & Identity | auth-store, supabase.ts, auth middleware, RLS policies |
| FR5-9: Task Capture | CaptureInput, capture-store, keyboard shortcut |
| FR10-13: Extraction | ExtractionForm, extract route, LLM provider, shared schema |
| FR14-17: Graceful Degradation | ExtractionForm dual-mode, capture-store state machine, 5s timeout |
| FR18-24: Task Organization | GroupPillBar, TaskList sorting, group-store, groups route |
| FR25-28: Task Management | TaskItem, task-store optimistic, tasks route (CRUD + soft-delete) |
| FR29-32: Task Completion | CompletedSection, tasks route (complete/uncomplete) |
| FR33-34: Extraction Feedback | FeedbackButton, feedback route, extraction_feedback table |
| FR35-36: First-Use Experience | EmptyState component |
| FR37-43: AI Transparency & Config | AiIndicator, LLM provider abstraction, privacy boundary |

**Recurrence:** Extracted by LLM but not persisted in MVP — documented as growth-phase feature.

**Non-Functional Requirements (22 NFRs):** All covered.

| NFR | Architectural Support |
|---|---|
| Performance (FCP ≤1.5s, Lighthouse ≥90) | Svelte ~2-5KB runtime, Tailwind purging, self-hosted font, Lighthouse CI gate |
| Security (auth, secrets, HTTPS) | JWT verification + 60s cache, RLS, env-only secrets, HTTPS via proxy, rate limiting |
| Accessibility (WCAG 2.1 AA) | Bits UI WAI-ARIA primitives, axe-core CI gate, keyboard flow |
| Integration (Supabase, OpenRouter, LM Studio) | Per-request Supabase client, LLMProvider interface, env-based switching |
| Reliability (degradation, durability) | ExtractionForm dual-mode, localStorage pending mutations, Supabase persistence |

### Implementation Readiness ✅

**Decision Completeness:** All critical decisions documented with rationale. Technology stack specified. API endpoints defined. Data model with RLS policies documented. Error codes enumerated with SPA behavior mapping.

**Structure Completeness:** Every file has a defined location with FR mapping. Workspace package names explicitly listed. Component conditional rendering documented.

**Pattern Completeness:** Naming, schema ownership, transform ordering, $effect() restrictions, import order, date formats, null handling, ID generation, validation timing, and component file structure all specified with examples.

### Validation Issues Addressed

All issues found during validation have been resolved in-place:

| Source | Issue | Resolution |
|---|---|---|
| Coherence check | P0 RLS description referenced service role key | Updated to reflect per-request client with user JWT |
| Coherence check | @fastify/cors in init commands | Removed — same-domain eliminates CORS |
| Coherence check | Recurrence extracted but no storage | Explicit MVP scope note added |
| Active Recall #4 | Stale "5+ unsynced" banner threshold | Updated to ">60s for any task" in cross-cutting concerns |
| Active Recall #9 | Auth middleware error format unspecified | P0 hardening now specifies HTTP 401 with standard error JSON |
| Active Recall #11 | Workspace package names implicit | All 5 packages explicitly named in project tree |
| Active Recall #12 | AppLayout rendering rules undocumented | State-by-state table added for captureStore → component visibility |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context analyzed from 5 input documents
- [x] 44 FRs and 22 NFRs mapped to architectural decisions
- [x] Scale and complexity assessed (Medium, solo developer)
- [x] 8 cross-cutting concerns identified and addressed
- [x] Technical constraints documented with architectural impact

**✅ Technology Stack**
- [x] SPA framework selected with comparative analysis (Svelte 5)
- [x] BFF pattern defined with system boundary diagram
- [x] All dependencies identified (Bits UI, shadcn-svelte, Fastify, Supabase SDK, Zod, Pino)
- [x] Build tooling specified (Vite, Turborepo, pnpm, Docker)
- [x] Testing framework specified (Vitest, Playwright, @testing-library/svelte)

**✅ Architectural Decisions**
- [x] Data architecture (schema, migrations, RLS, caching)
- [x] Authentication & security (same-domain, per-request JWT, hardening table)
- [x] API communication (error codes, timeouts, LLM schema, provider abstraction)
- [x] Frontend architecture (stores, optimistic UI, JWT refresh, API client, bundle)
- [x] Infrastructure (Docker Compose, dev vs prod, CI/CD pipeline, logging, monitoring)

**✅ Implementation Patterns**
- [x] Naming conventions (DB, API, TypeScript, Svelte)
- [x] Schema ownership rules (shared vs local)
- [x] Structure patterns (co-located tests, by-type components)
- [x] Format patterns (dates, nulls, IDs, ApiResult)
- [x] Svelte reactivity patterns ($effect() allowlist, component structure, props)
- [x] Process patterns (validation timing, import order)
- [x] Enforcement guidelines

**✅ Project Structure**
- [x] Complete directory tree with every file and FR mapping
- [x] Architectural boundaries (API, component, data, config)
- [x] Requirements-to-structure mapping for all 9 FR categories
- [x] Development workflow (local dev + production deployment)

**✅ Quality Assurance**
- [x] Pre-mortem analysis: 6 failure scenarios mitigated
- [x] Self-consistency validation: 6 cross-layer checks passed
- [x] Critical perspective review: 6 structural issues resolved
- [x] Active recall testing: 4 ambiguities eliminated (12/12 clear)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High** — validated through four independent elicitation methods (pre-mortem, self-consistency, critical perspective, active recall) across all architectural layers.

**Key Strengths:**
- Lightweight stack with massive performance headroom (Svelte ~2-5KB vs FCP ≤1.5s budget)
- Defense-in-depth security (API user_id from JWT + RLS policies + rate limiting)
- Resilient optimistic UI with localStorage persistence surviving page refresh
- Single source of truth for types (Zod schemas in shared package)
- Same-domain deployment eliminates an entire class of CORS/config problems
- Comprehensive CI pipeline (8 gates from lint to Docker build)

**Areas for Future Enhancement (Post-MVP):**
- Centralized logging / APM (replace docker logs grep with proper observability)
- Recurrence storage and recurring task creation
- Horizontal scaling (connection pooling, CDN, load balancing)
- API versioning for backward compatibility
- Offline-first with service worker (full PWA)
- Database connection pooling (PgBouncer) if user count grows

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries — every file has a designated location
- Route all API calls through the typed client (`lib/api.ts`) — no direct fetch
- Use `packages/shared` Zod schemas as the single source of truth for API contracts
- Follow the $effect() allowlist — justify any new use case in code comments
- Refer to this document for all architectural questions before making assumptions

**First Implementation Priority:**
1. Run initialization commands to scaffold the Turborepo monorepo
2. Define Zod schemas in `packages/shared` (task, group, extraction, API contracts)
3. Set up Supabase project + initial migration (tables, enums, RLS policies)
4. Implement Fastify BFF with auth middleware + health endpoint
5. Scaffold Svelte SPA with auth flow and runtime config loading
