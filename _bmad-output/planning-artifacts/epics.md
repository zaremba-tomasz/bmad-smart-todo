---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

# todo-app-bmad-training - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for todo-app-bmad-training (Smart Todo), decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can log in via passwordless magic link sent to their email
FR2: Users can log out
FR3: User sessions persist across browser closes (users stay logged in until explicit logout)
FR4: Users see only their own tasks (server-enforced data isolation — no client-side filtering alone)
FR5: Users can enter a task in natural language via a quick capture text input
FR6: Users can trigger the quick capture input via a keyboard shortcut
FR7: Users can access the quick capture input via a persistent UI element; visible immediately on load without scrolling on any breakpoint
FR8: Users can submit natural language input for LLM-powered extraction
FR9: Users see visual feedback indicating extraction is in progress after submitting natural language input
FR10: Users can view extracted structured fields (title, due date, due time, location, priority) in an editable form after submission
FR11: Users can edit any extracted field before saving
FR12: Users can save a task with one click/action after reviewing extracted fields
FR13: Users can capture multiple tasks in rapid succession without navigating away from the capture interface
FR14: Users are presented with a manual structured form when LLM extraction times out (5 seconds) or fails
FR15: The manual form pre-populates the title field with the user's raw input text
FR15a: The manual form may apply lightweight client-side parsing (regex date extraction, priority keyword matching) as a middle tier between full LLM extraction and a blank form (implementation consideration, not hard requirement)
FR16: Users can manually fill all task fields (title, due date, due time, location, priority) via the manual form
FR17: Users can save tasks via the manual form with the same one-click action as the extraction path
FR18: Users can create up to 3 task groups
FR19: Users can name and rename their task groups
FR20: Users can assign a task to a group during capture or editing
FR21: Users can save tasks without assigning a group (ungrouped/inbox state)
FR22: Users can view tasks filtered by group
FR23: Users can view all tasks across groups in a unified list
FR24: The default task ordering surfaces urgent and due-soon tasks prominently (priority-weighted sort with due date tiebreaker); tasks with no priority/due date remain visible but do not outrank explicitly prioritized items
FR25: Users can view their list of open (incomplete) tasks
FR26: Users can view task details (title, due date, due time, location, priority, group)
FR27: Users can edit any field of an existing task
FR28: Users can delete a task with a recovery path (undo toast, confirmation dialog, or soft-delete with retention period)
FR29: Users can mark a task as complete
FR30: Users can view a list of completed tasks; list must remain performant as it grows (specific presentation deferred to UX design but unbounded flat list is not acceptable)
FR31: Users can unmark a completed task (return to open)
FR32: Users can see the count of completed tasks
FR33: Users can provide thumbs up/down feedback on extraction quality; feedback prompt prominently visible during validation period, transitions to appearing only after field corrections once quality is established
FR34: The system records extraction feedback for analysis (correction rates, thumbs up/down signals)
FR35: New users see an empty state that guides them toward their first task capture
FR36: The empty state presents a suggested rich example input demonstrating multi-field extraction on first use
FR37: The extraction interface displays a visible "Powered by AI" indicator
FR38: The system sends only the raw task text to the LLM API — no user metadata, task history, or group information
FR39: The system is configured to use LLM providers that do not retain prompts or train on user data
FR40: The system supports OpenRouter as the LLM provider in production
FR41: The system supports LM Studio as the LLM provider in development
FR42: Switching between LLM providers requires only configuration changes, not code changes
FR43: A server-side component manages API keys, request forwarding, and timeout enforcement without exposing secrets to the client

### NonFunctional Requirements

**Performance:**
NFR1: LLM extraction target latency ≤3s (p90) for selected models
NFR2: LLM extraction degradation timeout — 5s hard cutoff to manual form
NFR3: Capture-to-save time ≤5s from extraction display to saved task
NFR4: First Contentful Paint ≤1.5s
NFR5: Largest Contentful Paint ≤2.5s
NFR6: Time to Interactive ≤3.0s
NFR7: Cumulative Layout Shift ≤0.1
NFR8: Lighthouse Performance score ≥90, maintained as CI quality gate
NFR9: Supabase query latency ≤500ms for task CRUD operations

**Security:**
NFR10: Passwordless magic link authentication via Supabase Auth — no passwords stored or managed
NFR11: Session management via Supabase with persistence across browser closes; iOS Safari token eviction risk must be addressed
NFR12: Row-level security via Supabase RLS — users can only read/write their own tasks
NFR13: API key protection — OpenRouter API key and Supabase service role key stored server-side only, never exposed to client
NFR14: IP whitelisting at infrastructure level restricts access to known users during MVP validation
NFR15: Transport encryption — all traffic over HTTPS, Supabase enforces TLS for database connections
NFR16: No sensitive data in client storage — auth tokens managed by Supabase SDK only

**Accessibility:**
NFR17: WCAG 2.1 Level AA compliance from day one — hard requirement, not a growth-phase goal
NFR18: Keyboard operability — complete capture-to-save flow and all task management fully operable via keyboard
NFR19: Screen reader compatibility — dynamic content updates announced via ARIA live regions
NFR20: Focus management — predictable focus behavior during extraction-to-form transitions; no lost or trapped focus
NFR21: Color contrast — minimum 4.5:1 for normal text, 3:1 for large text
NFR22: Visible focus indicators on all interactive elements
NFR23: Touch targets — minimum 44x44px for all interactive elements on touch devices
NFR24: Automated accessibility testing (axe-core) integrated into CI pipeline

**Integration:**
NFR25: Supabase integration — Auth (magic link), PostgreSQL (task persistence), RLS (user isolation)
NFR26: OpenRouter integration — LLM extraction via REST API with JSON Schema structured output, provider filtering for no-training
NFR27: LM Studio integration — local LLM inference for zero-cost development with same API contract as OpenRouter
NFR28: Provider abstraction — single extraction endpoint in backend, routing based on environment config

**Reliability:**
NFR29: Graceful degradation — LLM failure results in manual form presentation, never an error page or broken state
NFR30: Data durability — tasks persisted in Supabase PostgreSQL with standard backup policies
NFR31: Auth resilience — active sessions continue if Supabase Auth temporarily unavailable
NFR32: Extraction independence — task creation succeeds even if LLM provider is completely down

### Additional Requirements

**Starter Template & Monorepo:**
- Architecture specifies Turborepo monorepo with pnpm workspaces: apps/web (Svelte 5 SPA), apps/api (Fastify BFF), packages/shared (Zod schemas), packages/config (shared tooling), e2e/ (Playwright tests)
- Project initialization using specific scaffold commands should be the first implementation story
- Svelte 5 + Vite (no SvelteKit) as SPA framework with Bits UI + shadcn-svelte for accessible primitives
- Fastify BFF as backend proxy — all data flows through /api/* endpoints
- TypeScript strict mode across all packages; Zod for runtime validation
- pnpm-workspace.yaml with minimumReleaseAge: 20160 (14 days)

**Database & Data Architecture:**
- Three tables: tasks, groups, extraction_feedback with specific column definitions
- Soft-delete via deleted_at column for task deletion recovery (FR28)
- Priority as PostgreSQL enum: low, medium, high, urgent
- RLS policies: deny anon + user isolation (auth.uid() = user_id) on all tables
- Supabase migrations via CLI (supabase migration new / db push)
- Schema drift detection in CI via supabase db diff — no direct dashboard edits
- Database backup policy required

**Authentication & Security Architecture:**
- Same-domain deployment with reverse proxy routing (eliminates CORS)
- Per-request Supabase client created with user's JWT for RLS enforcement
- JWT verification via supabase.auth.getUser() with 60s in-memory cache
- user_id extracted ONLY from verified JWT, NEVER from request params/body
- Auth email allowlist for 6-user MVP — open registration disabled
- Per-user extraction rate limit: 30 requests/minute on /api/extract
- JWT-based rate limiting (@fastify/rate-limit keyed by user_id, not IP)

**API & Communication:**
- 12 API endpoints defined (tasks CRUD, groups, extract, feedback, health)
- Error response format: { error: { code, message } } with specific error codes (VALIDATION_ERROR, NOT_FOUND, RATE_LIMITED, EXTRACTION_TIMEOUT, EXTRACTION_PROVIDER_ERROR, EXTRACTION_VALIDATION_FAILED, UNAUTHORIZED, SERVER_ERROR)
- Dual timeout: 4.5s API-side on LLM request + 5s client-side on fetch to /api/extract
- LLM structured output via Zod ExtractionResultSchema with nullable (not optional) fields
- Recurrence extracted by LLM but NOT stored in MVP database — display as read-only in extraction form
- LLM model version pinning in environment config
- Pino structured JSON logging for all extraction outcomes
- snakeToCamel / camelToSnake transform utilities at API boundary

**Frontend Architecture:**
- Four Svelte stores: authStore, taskStore, groupStore, captureStore (with state machine: idle → extracting → extracted/manual → saving)
- Optimistic UI with localStorage persistence: write local → persist pending mutations → background API write → retry 3x (5s/15s/30s) → global banner when any task unsynced >60s → auto-retry on reconnection → replay pending on page load
- JWT token refresh: read session.access_token at call time, retry on 401, redirect to login on refresh failure
- Typed API client in lib/api.ts: ApiResult<T> discriminated union, relative /api/* paths, Zod response validation
- Runtime config: SPA fetches /config.json on init (written by Docker entrypoint.sh)

**Infrastructure & CI/CD:**
- Docker Compose: proxy (Traefik/Nginx) + web (Nginx static) + api (Node.js) containers
- Local dev without Docker: Vite proxy routes /api/* to local Fastify
- CI pipeline with 8 gates: lint, typecheck, unit test, build, schema drift, accessibility (axe-core), E2E (Playwright), Lighthouse
- Testing: Vitest for unit/integration, Playwright for E2E, @testing-library/svelte for components
- Co-located test files (*.test.ts next to source), excluded from production builds via tsconfig.json

**Naming Conventions & Patterns:**
- Database: snake_case tables/columns; API JSON: camelCase; TypeScript: camelCase vars, PascalCase types; Svelte: PascalCase components; Store files: kebab-case.svelte.ts
- Schema ownership: packages/shared = API boundary types only; app-internal types stay local
- $effect() restricted to explicit allowlist (localStorage sync, onAuthStateChange, document title, navigator.onLine)
- Component props: callback functions with "on" prefix, no custom Svelte events
- Validation: client-side for UX convenience, API-side authoritative, business rules before DB

### UX Design Requirements

UX-DR1: "Clear + Warm" design language — three-tone color system (neutral warmth for environment, coral for urgency, amber for completion) on warm white canvas (#FDFBF7). Complete color token system: surface, surface-raised, surface-completed, surface-extracted, text-primary through text-tertiary, coral-100/500/600, amber-100/400/500/900, border tokens, shimmer tokens, semantic states.

UX-DR2: Inter variable font — self-hosted (~100KB), font-display: optional, fallback stack: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif. If Inter doesn't load within ~100ms, system font stays for that page load.

UX-DR3: Three-voice typography system — Loud (semibold 600, 17px/1.0625rem, line-height 1.35) for task titles and emphasis; Quiet (regular 400, 14px/0.875rem, line-height 1.45) for metadata, labels, section headers; Input (regular 400, 16px/1rem, line-height 1.5) for capture input (16px prevents iOS Safari auto-zoom). No font size below 12px.

UX-DR4: 4px base spacing unit with defined scale — space-1 (4px) through space-8 (32px). Task item anatomy: 12px vertical padding, 8px checkbox-to-title gap, 4px title-to-metadata gap, 1px border separators.

UX-DR5: Responsive capture input placement — bottom-docked on mobile (position: fixed, bottom: 0, env(keyboard-inset-bottom) for virtual keyboard, full-width), top-prominent on desktop (static, auto-focused on load, max-width centered). CSS Grid with named areas for same DOM, different visual position.

UX-DR6: Extraction form with populated-fields-only display — only fields with extracted values shown initially. Empty fields hidden behind "+ Add date", "+ Add priority" etc. controls that fade in after 500ms delay. Partial extraction visually indistinguishable from "input only contained this information."

UX-DR7: Conditional extraction shimmer — no visual change if extraction returns ≤800ms; breathing shimmer (2s ease-in-out infinite, barely perceptible opacity pulse) if >800ms; manual form at 5s timeout. prefers-reduced-motion replaces shimmer with static "Processing..." text.

UX-DR8: 250ms extraction field reveal animation — fields snap into place with ease-out timing using compositable CSS properties only (opacity, transform). First-time magic comes from content (correctly filled fields), not animation duration.

UX-DR9: Completion micro-feedback — 300ms non-blocking animation: checkbox fills + text grays to text-tertiary + amber tint (surface-completed) spreads + count increments (+1 visible in periphery). Multiple completions can fire in parallel during rapid tapping.

UX-DR10: Temporal grouping with lightweight sticky section headers — "Today", "This Week", "Later", "No Date" as client-side partition on task array. Section headers use quiet voice, uppercase, text-secondary color. Empty groups not rendered.

UX-DR11: Completed tasks stay in place during active scanning (no list rearrangement while user is interacting). Completed tasks relocate to CompletedSection only after 5 seconds of no interaction. Prevents disorienting "jumping list."

UX-DR12: CompletedSection — always-visible completed count with temporal framing ("3 today · 14 this week"). Collapsed by default showing header only. Expandable list with amber surface treatment (surface-completed background). "0 today · 2 this week" is honest, not hidden.

UX-DR13: Type-ahead/burst mode — if user starts typing while extraction form is showing, keystrokes refocus capture input and previous extraction auto-saves. Unblocks rapid-fire capture without requiring explicit save first.

UX-DR14: Instant capture reset after save — input clears and cursor returns in same frame as save. No success toasts, no save animations, no delays. Extraction form closes/collapses. The speed of the reset IS the product's personality.

UX-DR15: Pin-tab prompt — desktop only, one-time after first successful save, dismissible (localStorage flag, never shown again). Non-modal banner using Dialog primitive. Text: "Pin this tab for quick access."

UX-DR16: Empty state — placeholder example in capture input ("Call the dentist next Monday, high priority"), warm icon (subtle, not cartoonish), invitation text "Your task list is clear." (confidence, not excitement). Disappears on first task save. Does not reappear when all tasks completed.

UX-DR17: GroupPillBar — horizontal scrollable pill filters with "All" always first. Progressive enhancement: bar not rendered when user has no groups. Single-select via ToggleGroup primitive. Selected pill uses accent-hot background. Filtered view removes redundant group badges from TaskItem metadata.

UX-DR18: Browser tab title — dynamic "N tasks · Smart Todo" format. Warm presence, not pressure.

UX-DR19: Optimistic UI everywhere — task appears in list instantly on save; Supabase write fires in background. Per-task sync dot (text-tertiary, right edge) with tap-to-retry on failure. Global banner "Some tasks haven't synced yet" when 5+ tasks unsynced. Auto-retry on reconnection.

UX-DR20: All animations respect prefers-reduced-motion: reduce — extraction fields appear instantly, completion treatment applies instantly, shimmer replaced by static opacity state, relocate becomes instant swap. Applied via motion-reduce: Tailwind prefix.

UX-DR21: Animation timing vocabulary — instant (0ms), snap (100ms, ease-out), reveal (250ms, ease-out), settle (300ms, ease-in-out), breathe (2000ms looping), relocate (400ms, ease-in-out). No one-shot animation exceeds 400ms. All use compositable properties only (opacity, transform, background-color).

UX-DR22: "No error states" philosophy — degradation ladder: LLM timeout → manual form with "Add details yourself" label; partial extraction → populated fields only (looks like success); save fails → sync dot + retry; read fails → show cached list; auth expires → redirect to magic link. Never show "Something went wrong."

UX-DR23: Silent feedback pattern — state changes through visual treatment only. Never: toasts, success banners, confirmation dialogs, celebration animations, error modals. Feedback hierarchy: position change (strongest) → color change → count change → icon change → text change (quietest).

UX-DR24: Action hierarchy — Primary: Save (solid coral background, white text, full-width on mobile); Secondary: Complete (checkbox tap, no button styling); Tertiary: everything else (text links, muted icons, ghost buttons, text-secondary color). Only one primary action visible at a time.

UX-DR25: Surface-extracted tint (#FEFDF5) on AI-populated form fields — barely visible warm tint communicating "the AI filled this." Disappears when user edits the field (becomes surface-raised). Serves demo moment and trust-building.

UX-DR26: Priority badge color system — Urgent: coral-500 bg, white text; High: coral-100 bg, coral-600 text, coral-500 border at 50% opacity; Medium: amber-100 bg, amber-900 text, amber-500 border at 50% opacity; Low: stone-100 bg, text-secondary text, border-default.

UX-DR27: Date display in human-readable relative format — "Today", "Next Monday", "Saturday 2PM" (not ISO dates). Absolute date shown as secondary text on field focus. Relative format makes extraction feel intelligent.

UX-DR28: CSS Grid responsive layout — same DOM, different visual position on mobile vs desktop. Single column at all breakpoints. Centered max-width (640-680px) on desktop for comfortable reading width.

UX-DR29: Two breakpoints only — mobile (0-767px, default mobile-first styles) and desktop (≥768px, md: prefix). No lg:/xl:/2xl: prefixes. Tablet treated as "wide mobile" with bottom-docked input.

UX-DR30: Skip link — "Skip to task list" as first focusable element, visually hidden until focused.

UX-DR31: ARIA landmark structure — header (banner), nav (navigation, "Group filters"), main (task list with sections per temporal group), footer (contentinfo, mobile CaptureInput).

UX-DR32: Screen reader task capture flow — specific announcements: "Processing your task..." (on submit, only if >800ms), "Task fields ready" / "Task details extracted. Title: [x]. Due: [y]." (on result), "Task saved" (on save), focus returns to input.

UX-DR33: Extraction feedback (👍/👎) appears post-save on the saved task item for ~10s then fades. Never in the critical capture path. Purely optional telemetry. Tapping records quality data, does not change the task.

UX-DR34: Manual fallback contextual label — "Add details yourself" muted label when manual form appears due to timeout. Distinguishes from successful title-only extraction (which shows no label). Not an error — an acknowledgment.

UX-DR35: Save button never disabled — always responds to tap/click. Empty title validated on save attempt: title field receives focus and shows inline error. Validation errors appear inline below field, never in summary above form, never in toast.

### FR Coverage Map

FR1: Epic 1 - Passwordless magic link login
FR2: Epic 1 - Log out
FR3: Epic 1 - Session persistence across browser closes
FR4: Epic 1 - Server-enforced data isolation
FR5: Epic 2 - Natural language quick capture input
FR6: Epic 2 - Keyboard shortcut for capture input
FR7: Epic 2 - Persistent capture UI element, visible on load
FR8: Epic 2 - Submit input for LLM extraction
FR9: Epic 2 - Visual feedback during extraction
FR10: Epic 2 - View extracted fields in editable form
FR11: Epic 2 - Edit extracted fields before saving
FR12: Epic 2 - One-click save after review
FR13: Epic 2 - Rapid sequential capture
FR14: Epic 2 - Manual form on timeout/failure
FR15: Epic 2 - Title pre-populated in manual form
FR15a: Epic 2 - Optional client-side parsing in manual form
FR16: Epic 2 - Manual form supports all task fields
FR17: Epic 2 - Same save action for both paths
FR18: Epic 4 - Create up to 3 task groups
FR19: Epic 4 - Name and rename groups
FR20: Epic 4 - Assign task to group during capture/editing
FR21: Epic 4 - Save tasks without group (ungrouped default)
FR22: Epic 4 - View tasks filtered by group
FR23: Epic 4 - View all tasks in unified list
FR24: Epic 3 - Priority-weighted sort with due date tiebreaker
FR25: Epic 2 - View open (incomplete) tasks
FR26: Epic 3 - View task details
FR27: Epic 3 - Edit any field of existing task
FR28: Epic 3 - Delete task with recovery path
FR29: Epic 2 - Mark task as complete
FR30: Epic 3 - View completed tasks list (performant at scale)
FR31: Epic 2 - Unmark completed task
FR32: Epic 2 - See completed task count
FR33: Epic 3 - Thumbs up/down extraction feedback
FR34: Epic 3 - System records extraction feedback
FR35: Epic 2 - Empty state guides first capture
FR36: Epic 2 - Suggested rich example input
FR37: Epic 2 - "Powered by AI" indicator
FR38: Epic 2 - Only raw task text sent to LLM
FR39: Epic 2 - No-retention LLM providers
FR40: Epic 2 - OpenRouter support (production)
FR41: Epic 2 - LM Studio support (development)
FR42: Epic 2 - Config-only provider switching
FR43: Epic 1 - Server-side key/timeout management

## Epic List

### Epic 1: Project Foundation & User Authentication
Users can access the app securely via passwordless magic link, with session persistence across devices and server-enforced data isolation. This scaffolds the monorepo, database, auth flow, and basic SPA shell.
**FRs covered:** FR1, FR2, FR3, FR4, FR43

### Epic 2: Smart Task Capture & Core Loop
The atomic user experience: capture → see → complete. Users type naturally, see AI-extracted structured fields in an editable form, save with one click. When AI is unavailable, a manual form appears seamlessly. Tasks appear in a basic list. Users can mark tasks complete and see their completed count growing. New users see a warm empty state with a suggested example that guarantees first-use revelation. This is the complete product that proves the hypothesis.
**FRs covered:** FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR15a, FR16, FR17, FR25, FR29, FR31, FR32, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42

### Epic 3: Task List Experience & Management
The list becomes a real tool. Temporal sorting surfaces what's due today. The full completed section shows progress with temporal framing ("3 today, 14 this week"). Users can view task details, edit any field, and delete tasks with a recovery path. Extraction quality feedback (thumbs up/down) enables validation-period optimization.
**FRs covered:** FR24, FR26, FR27, FR28, FR30, FR33, FR34

### Epic 4: Task Organization
Users can create up to 3 groups for life-domain separation (Work, Family, Personal), assign tasks to groups during capture or editing, filter their list by group, and view all tasks in a unified view. Groups are a progressive enhancement — the app is fully functional without them.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23

## Epic 1: Project Foundation & User Authentication

Users can access the app securely via passwordless magic link, with session persistence across devices and server-enforced data isolation. This scaffolds the monorepo, database, auth flow, and basic SPA shell.

### Story 1.1: Monorepo Scaffold & Shared Packages

As a developer,
I want a properly scaffolded Turborepo monorepo with all project infrastructure,
So that I have a solid, consistent foundation for building features.

**Acceptance Criteria:**

**Given** the project is initialized from scratch
**When** I run the scaffold commands
**Then** the Turborepo monorepo is created with pnpm workspaces containing: apps/web (Svelte 5 + Vite + Tailwind CSS v4), apps/api (Fastify + TypeScript), packages/shared (@smart-todo/shared with Zod), packages/config (@smart-todo/config with shared ESLint 9 flat config and tsconfig)
**And** pnpm-workspace.yaml includes minimumReleaseAge: 20160

**Given** the monorepo is scaffolded
**When** I run `pnpm dev`
**Then** Turborepo runs both apps/web (Vite dev server on :5173) and apps/api (tsx watch on :3001) in parallel
**And** Vite's server.proxy routes /api/* requests to localhost:3001

**Given** the monorepo is scaffolded
**When** I run `turbo lint && turbo typecheck`
**Then** ESLint 9 runs with zero errors across all packages and TypeScript strict mode compiles with zero errors

**Given** the monorepo is scaffolded
**When** I inspect the Docker Compose configuration
**Then** docker-compose.yml defines three services: proxy (Traefik/Nginx reverse proxy routing /* → web, /api/* → api), web (multi-stage Dockerfile: node build → nginx serve), and api (Node.js Dockerfile)
**And** apps/web/docker/entrypoint.sh writes SUPABASE_URL and SUPABASE_ANON_KEY environment variables to /config.json at container startup
**And** apps/web/docker/nginx.conf serves static files with Cache-Control: no-store on /config.json

**Given** the monorepo is scaffolded
**When** I inspect packages/shared
**Then** it exports Zod schemas for: TaskSchema (id, userId, title, dueDate, dueTime, location, priority, groupId, isCompleted, completedAt, deletedAt, createdAt), ExtractionResultSchema (title, dueDate, dueTime, location, priority, recurrence — all nullable), API response wrappers (success: { data: T }, error: { error: { code, message } }), and error code enum
**And** all shared types are inferred from Zod schemas via z.infer<>
**And** TaskSchema's groupId field is a nullable UUID with no FK constraint — the groups table is created in Story 4.1; until then groupId is structurally present but always null

**Given** the monorepo is scaffolded
**When** I inspect .github/workflows/ci.yml
**Then** the CI pipeline defines stages for: lint, typecheck, unit test (Vitest), build, and placeholders for schema drift, accessibility, E2E, Lighthouse, and Docker build gates

**Given** the monorepo is scaffolded
**When** I inspect apps/api/.env.example
**Then** it documents all required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL, LM_STUDIO_URL, LLM_PROVIDER

### Story 1.2: Database Schema & Auth Configuration

As a developer,
I want the Supabase project configured with the tasks table, security policies, and auth settings,
So that user data is securely stored with row-level isolation from the first deployment.

**Acceptance Criteria:**

**Given** a Supabase project is provisioned
**When** the initial migration runs via `supabase db push`
**Then** the `tasks` table is created with columns: id (uuid, PK, default gen_random_uuid()), user_id (uuid, FK → auth.users, NOT NULL), title (text, NOT NULL), due_date (date), due_time (time), location (text), priority (task_priority enum: low/medium/high/urgent), group_id (uuid, nullable), is_completed (boolean, default false), completed_at (timestamptz), deleted_at (timestamptz), created_at (timestamptz, default now())
**And** the `task_priority` PostgreSQL enum is created with values: low, medium, high, urgent

**Given** the migration has run
**When** I inspect RLS policies on the tasks table
**Then** a policy denies all access via the anon key
**And** a policy enforces `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE operations
**And** RLS is enabled on the tasks table

**Given** the Supabase project is configured
**When** I inspect the auth settings
**Then** auth is restricted to an email allowlist (6 MVP users)
**And** open registration is disabled
**And** magic link is enabled as the authentication method

**Given** the migration files exist in supabase/migrations/
**When** the CI pipeline runs `supabase db diff`
**Then** no uncommitted schema differences are detected between migration files and the database

**Given** a supabase/config.toml exists
**When** I run `supabase start` locally
**Then** a local Supabase instance starts with the migration applied and auth configured

**Note:** RLS policy integration testing (verifying user isolation end-to-end) requires the auth middleware (Story 1.3) and task API routes (Story 2.1). RLS correctness is verified via integration tests in Story 2.1.

### Story 1.3: User Login & Session Management

As a user,
I want to log in via a magic link sent to my email and stay logged in across browser sessions,
So that I can access my tasks securely without managing a password.

**Acceptance Criteria:**

**Given** I am not logged in
**When** I enter my email address and submit the login form
**Then** a magic link is sent to my email via Supabase Auth
**And** I see a message confirming the link was sent

**Given** I received a magic link email
**When** I click the magic link
**Then** I am authenticated and redirected to the app
**And** my session is established via Supabase Auth SDK

**Given** I am logged in
**When** I close the browser and reopen the app
**Then** I am still logged in (session persists via Supabase token refresh)
**And** I do not need to re-authenticate

**Given** I am logged in
**When** I click the logout action
**Then** my session is terminated
**And** I am redirected to the login screen
**And** I cannot access any data without re-authenticating

**Given** I am logged in
**When** any API request is made to the Fastify BFF
**Then** the auth middleware verifies my Supabase JWT via supabase.auth.getUser()
**And** my user_id is extracted exclusively from the verified JWT payload, never from request parameters or body
**And** verified tokens are cached in-memory for 60 seconds to reduce Supabase API calls

**Given** I am logged in and my JWT has expired
**When** an API call returns HTTP 401 (UNAUTHORIZED)
**Then** the SPA's authStore triggers supabase.auth.refreshSession()
**And** the original request is retried once with the new token
**And** if refresh also fails, I am redirected to the login screen

**Given** my email is not on the allowlist
**When** I attempt to sign up or log in
**Then** I am not granted access
**And** I see an appropriate message

**Given** I am an authenticated user
**When** I attempt to query tasks via the API
**Then** the per-request Supabase client is created with my JWT
**And** RLS policies ensure I can only access my own data (FR4)

### Story 1.4: Authenticated App Shell with Responsive Layout

As a user,
I want to see a clean, responsive app layout after logging in,
So that I have a familiar, accessible interface ready for task management on any device.

**Acceptance Criteria:**

**Given** I am authenticated
**When** the app loads
**Then** App.svelte renders the authenticated view (AppLayout) instead of the login screen
**And** First Contentful Paint is ≤1.5s

**Given** I am viewing the app on mobile (viewport ≤767px)
**When** the layout renders
**Then** the page uses a CSS Grid layout with a single column
**And** the capture input area is fixed to the bottom of the viewport (placeholder, non-functional in this story)
**And** the main content area fills the remaining space above, scrollable
**And** horizontal padding is 16px (space-4)

**Given** I am viewing the app on desktop (viewport ≥768px)
**When** the layout renders
**Then** the content is centered with max-width 640px (max-w-xl mx-auto)
**And** the capture input area is positioned at the top of the content (placeholder, non-functional in this story)
**And** generous whitespace surrounds the centered content column

**Given** the layout renders on any breakpoint
**When** I inspect the design tokens in the Tailwind configuration
**Then** the color system is configured: surface (#FDFBF7), surface-raised (#FFFFFF), surface-completed (#FEF6E8), surface-extracted (#FEFDF5), text-primary (#1C1917), text-secondary (#78716C), text-tertiary (#A8A29E), coral-100/500/600, amber-100/400/500/900, border-default (#E7E5E4), border-focus (#D6D3D1), ring-focus (#F59E0B)
**And** the typography system uses Inter variable font (self-hosted, font-display: optional) with fallback stack: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif
**And** the three type voices are configured: loud (600 weight, 17px), quiet (400 weight, 14px), input (400 weight, 16px)
**And** the spacing scale uses a 4px base unit (space-1 through space-8)
**And** custom animation tokens are configured: snap (100ms), reveal (250ms), settle (300ms), breathe (2s), relocate (400ms)

**Given** the layout renders
**When** I inspect the HTML structure
**Then** ARIA landmarks are present: header with role="banner", a placeholder for nav with role="navigation", main with role="main"
**And** a "Skip to task list" link is the first focusable element, visually hidden until focused

**Given** the layout renders
**When** I navigate using only the keyboard
**Then** all interactive elements (logout button, skip link) have visible focus indicators (2px ring-focus amber-500, offset 2px)
**And** focus indicators use :focus-visible (shown on keyboard navigation, hidden on pointer)

**Given** a user prefers reduced motion
**When** the layout renders with `prefers-reduced-motion: reduce` enabled
**Then** all animations are disabled via the motion-reduce: Tailwind prefix

## Epic 2: Smart Task Capture & Core Loop

The atomic user experience: capture → see → complete. Users type naturally, see AI-extracted structured fields in an editable form, save with one click. When AI is unavailable, a manual form appears seamlessly. Tasks appear in a basic list. Users can mark tasks complete and see their completed count growing. New users see a warm empty state with a suggested example that guarantees first-use revelation. This is the complete product that proves the hypothesis.

### Story 2.1: Task CRUD API & Basic Store

As a user,
I want my tasks to be saved and retrievable through a reliable API,
So that my captured tasks are persisted and available across devices.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I create a task via POST /api/tasks with a title and optional fields (dueDate, dueTime, location, priority)
**Then** the API validates the request body against the shared Zod CreateTaskRequestSchema
**And** the task is inserted into the tasks table with my user_id from the verified JWT
**And** the API returns the created task in camelCase JSON format with HTTP 201
**And** the snake_case ↔ camelCase transform runs via the utility in apps/api/src/utils/transform.ts

**Given** I am authenticated
**When** I request GET /api/tasks
**Then** the API returns all my non-deleted tasks (where deleted_at IS NULL), both open and completed
**And** tasks are returned sorted by priority weight (urgent > high > medium > low > null) with due_date as tiebreaker

**Given** I am authenticated
**When** I request POST /api/tasks/:id/complete
**Then** the task's is_completed is set to true and completed_at is set to the current timestamp

**Given** I am authenticated
**When** I request POST /api/tasks/:id/uncomplete
**Then** the task's is_completed is set to false and completed_at is set to null

**Given** the API receives any task request
**When** the auth middleware processes the request
**Then** the per-request Supabase client is created with my JWT and RLS enforces user isolation
**And** integration tests verify that User A cannot access User B's tasks

**Given** the SPA initializes
**When** the taskStore loads
**Then** it fetches tasks via the typed API client (lib/api.ts) using GET /api/tasks
**And** tasks are stored as reactive state in the taskStore
**And** the API client reads the JWT from authStore at call time (reactive — always current token)
**And** the API client validates responses against shared Zod schemas

### Story 2.2: Optimistic Data Layer & Sync Resilience

As a user,
I want my actions to feel instant even on slow connections,
So that the app never makes me wait for a server round-trip.

**Acceptance Criteria:**

**Given** I create a task through the SPA
**When** the taskStore processes the mutation
**Then** the task appears in my local state immediately (optimistic UI) before the API confirms
**And** the pending mutation is persisted to localStorage
**And** a sync status of 'pending' is tracked for the task in the taskStore

**Given** a task was created optimistically
**When** the API confirms the save
**Then** the sync status changes to 'synced' and the pending mutation is removed from localStorage

**Given** a task mutation fails (create, complete, uncomplete)
**When** the API returns an error
**Then** the taskStore retries 3 times with exponential backoff (5s, 15s, 30s)
**And** the task's sync status remains 'pending' with a subtle sync dot visible on the task item (SyncIndicator component)
**And** tapping the sync dot triggers an immediate retry

**Given** the app is reloaded after a browser close
**When** the taskStore initializes
**Then** any pending mutations in localStorage are replayed before fetching fresh state from the API

**Given** the browser comes back online (navigator.onLine + online event)
**When** there are pending mutations
**Then** all pending mutations are automatically retried

**Given** any task has been unsynced for more than 60 seconds
**When** I view the app
**Then** a global muted banner appears: "Some tasks haven't synced yet"
**And** the banner is dismissible manually and auto-clears when all tasks sync

**Given** the API rejects a task on retry (validation error, not a transient failure)
**When** the server returns a non-retryable error
**Then** the optimistic local task is rolled back (removed from local state and localStorage)

**Given** this optimistic data layer exists
**When** future stories add mutations (completion, editing, deletion, group assignment)
**Then** they use the same optimistic pattern: local write → localStorage persist → background API → retry → rollback on rejection

### Story 2.3: Basic Task List & Empty State

As a user,
I want to see my tasks in a list and be guided when I have none,
So that I can review what I've captured and know how to start.

**Acceptance Criteria:**

**Given** I am authenticated and have no tasks
**When** the app loads
**Then** I see the EmptyState component with a warm icon (subtle, not cartoonish) and the text "Your task list is clear."
**And** the capture input area (placeholder, non-functional until Story 2.6) is visible in its responsive position

**Given** I have open tasks
**When** the app loads
**Then** the EmptyState is not shown
**And** I see a TaskList with my open tasks rendered as TaskItem components
**And** each TaskItem displays: title in loud voice (semibold 600, 17px), and a metadata row in quiet voice (regular 400, 14px) showing due date (human-readable relative format: "Today", "Next Monday", not ISO), priority badge (with correct color per UX-DR26), and location if present

**Given** tasks exist with different priorities and due dates
**When** the task list renders
**Then** tasks are displayed in the order returned by the API (priority-weighted with due date tiebreaker from Story 2.1)

**Given** I have completed tasks
**When** the app loads
**Then** I see a completed count always visible at the bottom of the task list area showing the total number of completed tasks
**And** the count is displayed with warm amber treatment

**Given** a new task is saved (via optimistic UI)
**When** the task appears in the list
**Then** it enters with a subtle opacity 0→1 transition over 200ms (settle timing)

**Given** I am viewing the task list
**When** I inspect the TaskItem touch targets
**Then** the checkbox area is at least 44x44px
**And** all interactive elements meet the minimum 44x44px touch target requirement

**Given** the EmptyState is visible
**When** I save my first task
**Then** the EmptyState disappears immediately (optimistic UI) and the task list appears with the new task

**Note:** The suggested rich example placeholder text (FR36: "Call the dentist next Monday, high priority") is delivered with the functional CaptureInput in Story 2.6, completing the first-use revelation experience.

### Story 2.4: Task Completion Flow

As a user,
I want to mark tasks as complete and see my progress growing,
So that I feel the satisfaction of getting things done.

**Acceptance Criteria:**

**Given** I have an open task in my list
**When** I tap the checkbox on the task
**Then** the task is marked as complete via POST /api/tasks/:id/complete (optimistic UI — visual feedback is instant)
**And** a 300ms non-blocking animation plays: checkbox fills with amber-500, text grays to text-tertiary, amber tint (surface-completed) spreads across the task item
**And** the completed count increments visibly (+1)
**And** an ARIA live region announces "Task completed. N tasks completed."

**Given** I mark multiple tasks complete rapidly
**When** I tap checkboxes in quick succession
**Then** each animation fires independently and in parallel — no blocking, no queuing
**And** the count increments for each completion

**Given** I completed a task
**When** the task is in the completed state and I tap its checkbox again
**Then** the task is returned to the open list via POST /api/tasks/:id/uncomplete (optimistic UI)
**And** the completion visual treatment is reversed
**And** the completed count decrements

**Given** I completed a task
**When** it remains in the task list
**Then** the completed task stays in place with completed visual treatment (grayed text, amber tint, filled checkbox)
**And** it does NOT relocate to a separate section — completed tasks remain in the active list in this story
**And** relocation to the full CompletedSection is delivered in Story 3.2

**Given** a user prefers reduced motion
**When** they mark a task complete
**Then** the completion visual treatment applies instantly (no animation)

**Given** the complete/uncomplete API call fails
**When** the retry logic exhausts (3 attempts)
**Then** the task shows a sync dot indicating the completion state hasn't been persisted
**And** the local optimistic state is preserved

### Story 2.5: LLM Provider Abstraction & Extraction API

As a user,
I want the system to extract structured task data from my natural language input,
So that I don't have to manually fill in dates, priorities, and locations.

**Acceptance Criteria:**

**Given** the API receives POST /api/extract with { text: "Call the dentist next Monday, high priority" }
**When** the extraction service processes the request
**Then** only the raw task text is sent to the LLM provider — no user metadata, task history, or group information (FR38)
**And** the LLM is prompted to return structured output matching the ExtractionResultSchema
**And** the response is validated against the Zod schema before returning to the client

**Given** the LLM returns a valid extraction
**When** the API responds
**Then** the response contains: { data: { title, dueDate, dueTime, location, priority, recurrence } } with nullable fields (explicit null for fields not extracted, never omitted)

**Given** the LLM response does not match the ExtractionResultSchema
**When** Zod validation fails
**Then** the API returns { error: { code: "EXTRACTION_VALIDATION_FAILED", message: "..." } }
**And** the failure is logged via Pino with event: "extraction", status: "validation_failed", duration_ms, model, provider

**Given** the LLM provider does not respond within 4.5 seconds
**When** the API-side timeout fires
**Then** the API returns { error: { code: "EXTRACTION_TIMEOUT", message: "..." } }
**And** the timeout is logged via Pino with event: "extraction", status: "timeout", duration_ms, model, provider

**Given** the LLM provider returns a non-timeout error (auth failure, model deprecated, malformed response)
**When** the error is caught
**Then** the API returns { error: { code: "EXTRACTION_PROVIDER_ERROR", message: "..." } }
**And** the error is logged via Pino with event: "extraction", status: "provider_error", duration_ms, model, provider

**Given** every extraction attempt
**When** it completes (success or failure)
**Then** a structured Pino log entry is written: { event: "extraction", status, duration_ms, model, provider }

**Given** LLM_PROVIDER environment variable is set to "openrouter"
**When** the extraction service initializes
**Then** it uses the OpenRouter implementation with the model specified in OPENROUTER_MODEL
**And** requests use JSON Schema response_format for structured output
**And** provider filtering enforces no-training policy (FR39)

**Given** LLM_PROVIDER environment variable is set to "lmstudio"
**When** the extraction service initializes
**Then** it uses the LM Studio implementation pointing to LM_STUDIO_URL
**And** the same Zod schema validation is applied to the response

**Given** I want to switch providers
**When** I change only the LLM_PROVIDER, OPENROUTER_MODEL, or LM_STUDIO_URL environment variables
**Then** the provider switches without any code changes (FR42)

**Given** I am an authenticated user
**When** I call POST /api/extract
**Then** the request is rate-limited to 30 requests per minute per user_id (from JWT)
**And** exceeding the limit returns { error: { code: "RATE_LIMITED" } }

### Story 2.6: Capture Input Component

As a user,
I want a persistent, responsive text input where I can type tasks naturally,
So that capturing a thought requires zero navigation and zero decisions.

**Acceptance Criteria:**

**Given** I am viewing the app on mobile
**When** the CaptureInput renders
**Then** it is fixed to the bottom of the viewport (position: fixed, bottom: 0)
**And** it respects env(keyboard-inset-bottom) for virtual keyboard offset, with JavaScript fallback via visualViewport.resize
**And** it spans full width with 16px horizontal padding
**And** the input height is at least 56px (exceeds 44px touch target minimum)
**And** the submit arrow button is right-aligned inside the input with aria-label="Submit task"

**Given** I am viewing the app on desktop
**When** the page loads
**Then** the CaptureInput is positioned at the top of the content area
**And** it receives auto-focus automatically (FR7)
**And** it has max-width matching the content column

**Given** I am on mobile
**When** the page loads
**Then** the CaptureInput does NOT auto-focus (prevents virtual keyboard from appearing on load)

**Given** the CaptureInput renders with no tasks in the list
**When** I see the placeholder text
**Then** it shows "Call the dentist next Monday, high priority" (FR36) — the suggested rich example that guarantees multi-field extraction on first use

**Given** I am anywhere on the page (desktop)
**When** I press the keyboard shortcut (/ or Ctrl+K)
**Then** focus moves to the CaptureInput immediately (FR6)

**Given** the CaptureInput is focused
**When** I type natural language text and press Enter (or tap the submit arrow)
**Then** the input text persists visibly (does not clear on submit — clears on save)
**And** the captureStore state transitions from 'idle' to 'extracting'
**And** a request is sent to POST /api/extract with my text

**Given** the CaptureInput has aria attributes
**When** a screen reader reads it
**Then** it announces aria-label="Add a task" with the placeholder described via aria-describedby

**Given** the CaptureInput is in the 'extracting' state
**When** I look at the input
**Then** the input text remains visible and the input is visually muted to indicate processing

### Story 2.7: Extraction Form & Review Flow

As a user,
I want to see the AI's structured understanding in an editable form and save with one tap,
So that I can confirm the extraction is right and capture my task in seconds.

**Acceptance Criteria:**

**Given** the extraction request is in flight
**When** less than 800ms has elapsed
**Then** no shimmer or loading indicator is shown (too fast for the user to register waiting)

**Given** the extraction request is in flight
**When** more than 800ms has elapsed without a response
**Then** a breathing shimmer appears on the extraction form area (animation: shimmer 2s ease-in-out infinite, subtle opacity pulse)
**And** if prefers-reduced-motion is set, static "Processing..." text is shown instead of the shimmer
**And** space is reserved for the form to prevent CLS

**Given** the extraction returns successfully
**When** the structured fields arrive
**Then** only populated fields are displayed with a 250ms ease-out reveal animation
**And** each AI-populated field has a surface-extracted tint (#FEFDF5) that disappears when the user edits the field
**And** due dates display in human-readable relative format ("Today", "Next Monday", not ISO dates)
**And** priority displays as a colored badge per UX-DR26
**And** empty fields are hidden — "+ Add date", "+ Add priority", "+ Add location" controls fade in after 500ms
**And** the captureStore state transitions to 'extracted'
**And** an ARIA live region announces "Task details extracted. Title: [x]. Due: [y]." listing populated fields

**Given** the extraction form is showing populated fields
**When** I tap any field
**Then** I can edit the value inline (FR11)
**And** the surface-extracted tint disappears on the edited field (becomes surface-raised)

**Given** the extraction form is showing
**When** I tap the Save button (or press Enter when Save is focused)
**Then** the task is created via POST /api/tasks with the form field values (optimistic UI)
**And** the task appears in the task list immediately
**And** the CaptureInput clears and the cursor returns — same frame as save, no toast, no delay (FR12, UX-DR14)
**And** the extraction form closes
**And** an ARIA live region announces "Task saved"
**And** focus returns to the CaptureInput

**Given** the Save button is visible
**When** I tap Save with an empty title
**Then** the title field receives focus and shows an inline validation error below the field
**And** the Save button is never disabled — it always responds (UX-DR35)

**Given** the extraction form is showing
**When** I inspect the tab order
**Then** focus moves through: title → date → priority → location → Save
**And** all fields have visible labels and focus indicators

### Story 2.8: Graceful Degradation & Manual Form

As a user,
I want to capture tasks even when the AI is unavailable,
So that extraction enhances my experience but never blocks it.

**Acceptance Criteria:**

**Given** I submitted text for extraction
**When** 5 seconds pass without a response (client-side timeout)
**Then** the captureStore state transitions to 'manual'
**And** the manual form appears with the title field pre-populated with my raw input text (FR15)
**And** all other fields (due date, due time, location, priority) are empty and editable (FR16)
**And** a muted label "Add details yourself" is shown — not an error, an acknowledgment (UX-DR34)
**And** no error messages, no "something went wrong" banners, no technical information is displayed

**Given** the API returns EXTRACTION_TIMEOUT error
**When** the SPA receives the error response
**Then** the same manual form behavior is triggered as the client-side 5s timeout

**Given** the API returns EXTRACTION_PROVIDER_ERROR or EXTRACTION_VALIDATION_FAILED
**When** the SPA receives the error response
**Then** the manual form appears identically to the timeout case

**Given** I am on the manual form
**When** I fill in fields and tap Save
**Then** the task is saved with the same one-click action as the extraction path (FR17)
**And** the task appears in my list via optimistic UI
**And** the input clears and cursor returns (identical to the extraction save flow)

**Given** the manual form is showing
**When** I inspect the visual treatment
**Then** the form looks identical to the extraction form — same fields, same layout, same Save button
**And** the only visual difference is the "Add details yourself" muted label and the absence of surface-extracted tint on fields

**Given** the extraction returns a partial result (title + date but no priority, no location)
**When** the form renders
**Then** only the populated fields are shown (title and date)
**And** no "Add details yourself" label is shown (partial extraction is a success, not a fallback)
**And** "+ Add priority", "+ Add location" controls fade in after 500ms

### Story 2.9: Rapid Capture, Pin Prompt & AI Transparency

As a user,
I want to capture multiple tasks in rapid succession, be prompted to pin the tab, and know that AI powers the extraction,
So that I can dump all my thoughts quickly, retain easy access, and trust the system transparently.

**Acceptance Criteria:**

**Given** I just saved a task
**When** I immediately type another task into the CaptureInput
**Then** the capture loop restarts without any delay or navigation (FR13)
**And** the extraction form from the previous task is already closed
**And** the input is empty and ready for new text

**Given** the extraction form is showing with populated fields
**When** I start typing new text into the CaptureInput (type-ahead / burst mode)
**Then** my keystrokes refocus the CaptureInput
**And** the previous extraction auto-saves with the currently displayed fields (UX-DR13)
**And** the new text triggers a fresh extraction cycle
**And** the previous task appears in my list via optimistic UI

**Given** I capture 3 tasks in rapid succession
**When** I complete the third save
**Then** all 3 tasks are visible in my list
**And** total time for an experienced user is under 60 seconds for 3 captures

**Given** the extraction form is showing
**When** I press Escape
**Then** the extraction is cancelled
**And** focus returns to the CaptureInput
**And** the input text is preserved (not cleared)

**Given** I just completed my first successful save on desktop
**When** the task appears in my list
**Then** a PinPrompt appears: "Pin this tab for quick access" with a dismiss button (UX-DR15)
**And** the prompt is a non-modal banner (no backdrop, no focus trap) using the Dialog primitive
**And** the prompt is shown only once — dismissal sets a localStorage flag and the prompt never appears again
**And** the prompt is not shown on mobile (desktop only)

**Given** the PinPrompt is visible
**When** I dismiss it (click ×, press Escape, or click elsewhere)
**Then** the prompt disappears permanently
**And** focus returns to the CaptureInput
**And** the prompt has role="status" and aria-live="polite"

**Given** the extraction interface is visible
**When** I inspect the UI
**Then** a visible "Powered by AI" indicator is present (FR37)
**And** the indicator uses text-secondary color and info styling — visible but not prominent

**Given** any extraction request is sent
**When** I inspect the request payload
**Then** only the raw task text is included — no user_id, no task history, no group names, no metadata (FR38)

**Given** the system is configured with LLM providers
**When** I inspect the provider configuration
**Then** providers are configured to not retain prompts or train on user data (FR39, OpenRouter no-training provider filtering)

**Given** the browser tab is open
**When** tasks exist in my list
**Then** the browser tab title shows "N tasks · Smart Todo" where N is the count of open tasks (UX-DR18)

## Epic 3: Task List Experience & Management

The list becomes a real tool. Temporal sorting surfaces what's due today. The full completed section shows progress with temporal framing ("3 today, 14 this week"). Users can view task details, edit any field, and delete tasks with a recovery path. Extraction quality feedback (thumbs up/down) enables validation-period optimization.

### Story 3.1: Temporal Grouping & Smart Sorting

As a user,
I want my tasks organized by when they're due with clear section labels,
So that I can scan "what matters now" without reading through everything.

**Acceptance Criteria:**

**Given** I have tasks with various due dates
**When** the task list renders
**Then** tasks are partitioned into temporal groups: "Today", "This Week", "Later", "No Date"
**And** each group has a lightweight sticky section header in quiet voice (uppercase, letter-spacing 0.05em, text-secondary color) showing the zone label and task count (e.g., "Today · 3 tasks")
**And** section headers use position: sticky and occlude scrolling content beneath with surface background

**Given** I have tasks within the same temporal group
**When** the group renders
**Then** tasks within the group are sorted by priority weight (urgent > high > medium > low > null) with due_date as tiebreaker (FR24)
**And** tasks with no priority or due date remain visible but do not outrank explicitly prioritized items

**Given** a temporal group has zero tasks
**When** the task list renders
**Then** that group's section header is not rendered (no "No tasks for today" placeholder)

**Given** I scroll through the task list on mobile
**When** I pass a section boundary
**Then** the sticky header for the current section remains visible at the top of the scroll area
**And** the previous header scrolls away naturally

**Given** the section headers render
**When** a screen reader encounters them
**Then** each header has role="heading" with aria-level="2" for landmark navigation

**Given** I have 20+ tasks across temporal groups
**When** I scan the list
**Then** the temporal landmarks make the list parsable in under 5 seconds — I can identify what's due today without scrolling through everything

### Story 3.2: Full Completed Section with Temporal Framing

As a user,
I want to see my completed tasks with a growing count that tells a story of momentum,
So that I feel the accumulated satisfaction of getting things done.

**Acceptance Criteria:**

**Given** I have completed tasks
**When** the CompletedSection renders
**Then** completed tasks now relocate from the active list to the CompletedSection after 5 seconds of no interaction (400ms ease-in-out transition; instant if prefers-reduced-motion is set) — this behavior was deferred from Story 2.4 until this proper destination existed
**And** the header is always visible showing: a trophy/check icon + "Completed" label + temporal count "N today · M this week"
**And** the count uses warm amber treatment (amber-400 highlight)
**And** the section is collapsed by default (header only, list hidden)

**Given** the CompletedSection header is visible
**When** I tap/click the header
**Then** the completed task list expands with surface-completed (#FEF6E8) background
**And** completed TaskItems are displayed with amber treatment (grayed text, checkmark filled with amber-500)
**And** the expand/collapse uses aria-expanded attribute
**And** the list is navigable with keyboard when expanded

**Given** the completed list is expanded
**When** I tap/click the header again
**Then** the list collapses back to header-only view

**Given** I have zero completed tasks
**When** the CompletedSection renders
**Then** the count shows "0 today · 0 this week" — honest, not hidden
**And** the section is still visible (count is always present regardless of number)

**Given** the temporal count updates
**When** midnight passes (local time)
**Then** "today" resets to 0 and "this week" reflects the rolling 7-day window

**Given** the completed list grows over weeks of use
**When** I expand the CompletedSection
**Then** the list remains performant and navigable (FR30)
**And** completed tasks are shown most-recent-first
**And** the list does not render as an unbounded ever-growing flat list (pagination, virtual scroll, or "show more" pattern applied)

**Given** the completed count changes
**When** a task is completed or uncompleted
**Then** an ARIA live region with aria-live="polite" announces the updated count

### Story 3.3: Task Detail View & Inline Editing

As a user,
I want to view and edit any field of an existing task,
So that I can correct mistakes or update tasks as plans change.

**Acceptance Criteria:**

**Given** I have a task in my list
**When** I tap/click on the task (not the checkbox)
**Then** I see the full task details: title, due date (relative format), due time, location, priority badge, and group (if assigned) (FR26)

**Given** I am viewing task details
**When** I tap/click on any field
**Then** the field becomes editable inline (FR27)
**And** date fields accept natural language re-entry ("next Tuesday") or a date picker on explicit tap
**And** priority is selectable from the enum options (low, medium, high, urgent, or clear)

**Given** I edited a field on an existing task
**When** I confirm the edit (tap away, press Enter, or tap a save/confirm action)
**Then** the task is updated via PATCH /api/tasks/:id with only the changed fields (optimistic UI)
**And** the task list reflects the update immediately
**And** if the due date changed, the task may move to a different temporal group

**Given** I edit a task and the API call fails
**When** the retry logic exhausts
**Then** the task shows a sync dot indicating the edit hasn't been persisted
**And** the local optimistic edit is preserved

**Given** I am editing a task
**When** I press Escape
**Then** the edit is cancelled and the field reverts to its previous value

**Given** I am viewing/editing task details
**When** I navigate with keyboard
**Then** Tab moves through editable fields in logical order
**And** all fields have visible labels and focus indicators

### Story 3.4: Task Deletion with Recovery

As a user,
I want to delete tasks I no longer need with a way to recover from accidental deletions,
So that I can keep my list clean without fear of losing important tasks.

**Acceptance Criteria:**

**Given** I have a task in my list
**When** I trigger the delete action on the task
**Then** the task is removed from my visible list immediately (optimistic UI)
**And** the API sends DELETE /api/tasks/:id which sets deleted_at to the current timestamp (soft-delete, not permanent removal)

**Given** I just deleted a task
**When** the deletion completes
**Then** an undo mechanism appears (e.g., dismissible undo toast or inline undo link) for a limited time window
**And** tapping "Undo" restores the task to my list via PATCH /api/tasks/:id setting deleted_at back to null

**Given** the undo window expires
**When** the undo mechanism disappears
**Then** the task remains soft-deleted in the database (deleted_at is set)
**And** the task no longer appears in any API query results (GET /api/tasks filters where deleted_at IS NULL)

**Given** I delete a task and the API call fails
**When** the retry logic exhausts
**Then** the task reappears in my list (optimistic rollback)
**And** a sync dot indicates the deletion wasn't persisted

**Given** the delete action is available
**When** I inspect the UI
**Then** the delete control uses tertiary action styling (text-secondary, ghost button) — never primary or destructive red
**And** the touch target is at least 44x44px

**Given** I am using a screen reader
**When** I trigger delete
**Then** an ARIA live region announces "Task deleted. Undo available."
**And** the undo control is keyboard accessible

### Story 3.5: Extraction Feedback & Telemetry

As a user,
I want to provide feedback on extraction quality,
So that the system can improve its accuracy over time.

**Acceptance Criteria:**

**Given** the extraction_feedback table does not yet exist
**When** this story's migration runs
**Then** the `extraction_feedback` table is created with columns: id (uuid, PK), user_id (uuid, FK → auth.users), task_id (uuid, FK → tasks), rating (feedback_rating enum: thumbs_up/thumbs_down), raw_input (text), extracted_fields (jsonb), created_at (timestamptz)
**And** RLS policies deny anon access and enforce auth.uid() = user_id for SELECT and INSERT

**Given** I just saved a task that went through the extraction path
**When** the task appears in my list
**Then** subtle 👍/👎 feedback icons appear on the saved task item (FR33)
**And** the icons use tertiary styling (text-secondary, 44x44px touch targets)
**And** the icons are not in the capture critical path — they appear post-save only

**Given** the feedback icons are visible on a task
**When** approximately 10 seconds pass without interaction
**Then** the icons fade away gracefully (UX-DR33)

**Given** I tap 👍 on a saved task
**When** the feedback is submitted
**Then** POST /api/feedback is called with { taskId, rating: "thumbs_up", rawInput, extractedFields }
**And** the feedback is stored in the extraction_feedback table (FR34)
**And** the icon is acknowledged (subtle visual confirmation) and then fades
**And** tapping feedback does not change the task itself

**Given** I tap 👎 on a saved task
**When** the feedback is submitted
**Then** POST /api/feedback is called with { taskId, rating: "thumbs_down", rawInput, extractedFields }
**And** the feedback is stored in the extraction_feedback table

**Given** I edited fields before saving (corrected the extraction)
**When** the feedback icons appear
**Then** the icons are more prominently visible (the correction signals potential quality issues — FR33 prominence transition)

**Given** extraction quality is established over time
**When** I save tasks without any field corrections
**Then** the feedback icons appear with reduced prominence or only after field corrections (FR33 prominence transition)

**Given** a screen reader user encounters feedback icons
**When** the icons are announced
**Then** they have aria-label="Rate extraction quality: good" and "Rate extraction quality: poor"

## Epic 4: Task Organization

Users can create up to 3 groups for life-domain separation (Work, Family, Personal), assign tasks to groups during capture or editing, filter their list by group, and view all tasks in a unified view. Groups are a progressive enhancement — the app is fully functional without them.

### Story 4.1: Group CRUD API & Store

As a user,
I want the system to support task groups so I can organize by life domain,
So that my work, family, and personal tasks don't blur together.

**Acceptance Criteria:**

**Given** the groups table does not yet exist
**When** this story's migration runs
**Then** the `groups` table is created with columns: id (uuid, PK, default gen_random_uuid()), user_id (uuid, FK → auth.users, NOT NULL), name (text, NOT NULL), created_at (timestamptz, default now())
**And** RLS policies deny anon access and enforce auth.uid() = user_id for SELECT, INSERT, UPDATE, DELETE
**And** RLS is enabled on the groups table
**And** the tasks table's group_id column is confirmed as FK → groups (migration adds constraint if not present)

**Given** I am authenticated
**When** I request POST /api/groups with { name: "Work" }
**Then** the group is created with my user_id and returned with HTTP 201

**Given** I already have 3 groups
**When** I request POST /api/groups with a new group name
**Then** the API returns an error with a clear message indicating the 3-group maximum is reached (FR18)
**And** the limit is enforced server-side in API business logic, not only client-side

**Given** I am authenticated
**When** I request GET /api/groups
**Then** the API returns all my groups sorted by created_at

**Given** I have a group
**When** I request PATCH /api/groups/:id with { name: "Family" }
**Then** the group is renamed (FR19)
**And** the API returns the updated group

**Given** I have groups
**When** the SPA initializes
**Then** the group-store loads my groups from GET /api/groups
**And** groups are available as reactive state for the GroupPillBar and task assignment

### Story 4.2: Group Management UI

As a user,
I want to create and rename my task groups,
So that I can set up the life domains that matter to me.

**Acceptance Criteria:**

**Given** I have no groups
**When** I access the group management affordance
**Then** I can create a new group by entering a name
**And** the 3-group limit is communicated upfront ("You can create up to 3 groups") — not discovered as a wall after investment

**Given** I have fewer than 3 groups
**When** I create a new group
**Then** the group appears in the GroupPillBar immediately (optimistic UI)
**And** the group is persisted via POST /api/groups

**Given** I have exactly 3 groups
**When** I attempt to create another group
**Then** the create action is unavailable with a clear explanation that the maximum has been reached

**Given** I have an existing group
**When** I tap/click on the group name to rename it
**Then** the name becomes editable inline
**And** confirming the edit renames the group via PATCH /api/groups/:id (optimistic UI)

**Given** I am managing groups
**When** I navigate with keyboard
**Then** all group management controls are keyboard accessible with visible focus indicators

### Story 4.3: Group Assignment & Filtering

As a user,
I want to assign tasks to groups and filter my list by group,
So that I can focus on one life domain at a time.

**Acceptance Criteria:**

**Given** I am creating a task (extraction form or manual form) and I have groups
**When** I look at the form fields
**Then** a group assignment option is available (e.g., a group selector or "+ Add group" control)
**And** I can assign the task to one of my groups (FR20)
**And** assigning a group is optional — I can save without choosing one (FR21, ungrouped default)

**Given** I am editing an existing task
**When** I change the group assignment
**Then** the task's group_id is updated via PATCH /api/tasks/:id (optimistic UI)
**And** the task moves to the correct filtered view

**Given** I have groups and tasks assigned to them
**When** the GroupPillBar renders
**Then** it shows a horizontal scrollable row of pill buttons with "All" always first
**And** each user-created group has a pill
**And** "All" is selected by default
**And** selected pill uses coral (accent-hot) background with white text
**And** unselected pills use border-default background with text-secondary text

**Given** I have no groups
**When** the task list renders
**Then** the GroupPillBar is not rendered — progressive enhancement, no empty bar (UX-DR17)

**Given** I tap a group pill (e.g., "Work")
**When** the filter is applied
**Then** the TaskList shows only tasks assigned to that group (FR22)
**And** the group badge is removed from TaskItem metadata (redundant when filtering — UX-DR17)
**And** temporal grouping (Today / This Week / Later / No Date) still applies within the filtered view

**Given** I tap the "All" pill
**When** the filter is cleared
**Then** I see all tasks across all groups in a unified list (FR23)
**And** group badges reappear on TaskItems that have a group assigned

**Given** I am using the GroupPillBar
**When** I navigate with keyboard
**Then** arrow keys move between pills (roving tabindex via ToggleGroup primitive)
**And** Space selects a pill
**And** the bar has aria-label="Filter by group"
**And** the active filter is announced to screen readers

**Given** ungrouped tasks exist
**When** I filter by a specific group
**Then** ungrouped tasks are not shown in the filtered view
**And** ungrouped tasks are visible when "All" is selected
