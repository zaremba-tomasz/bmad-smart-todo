# Sprint Change Proposal — Self-Contained Docker Compose with Supabase Services

**Date:** 2026-04-21
**Status:** Approved
**Scope:** Minor (infrastructure only)
**Approved by:** Tomasz

---

## 1. Issue Summary

The `docker-compose.yml` defined only three application services (proxy, web, api) and required an external Supabase instance — either cloud-hosted or via a separate `supabase start` command — to function. Running `docker compose up` on a fresh clone produced a non-functional stack because `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` resolved to empty values.

**Discovery:** During Epic 2 implementation, confirmed that the Docker deployment path was incomplete for standalone use.

## 2. Impact Analysis

### Epic Impact
None. All epics (1–4) and their stories remain unchanged. No scope, priority, or sequencing modifications.

### Story Impact
No current or future stories require changes. This is purely infrastructure.

### Artifact Conflicts

| Artifact | Impact |
|---|---|
| `docker-compose.yml` | **Major rewrite** — added 7 Supabase services, YAML anchors for secrets, zero-config defaults |
| `architecture.md` | **Section update** — Docker Compose Structure rewritten with 10-service topology table |
| `.env.example` | **Replaced** — external-Supabase vars → self-hosted secrets with documented defaults |
| `apps/api/.env.example` | **Updated** — added guidance comments for local dev vs Docker URLs |
| `docker/supabase/*` | **4 new files** — Kong config, entrypoint, DB roles and JWT init scripts |

### Technical Impact
- No application code changes
- No database schema changes
- No API contract changes
- Docker Compose now pulls 7 additional images (~2GB total first pull)
- System requirements: ~4GB RAM recommended for full stack

## 3. Recommended Approach

**Direct Adjustment** — modify infrastructure files only, no story or epic changes needed.

- **Effort:** Medium (completed in this session)
- **Risk:** Low — uses official Supabase Docker images with documented configurations
- **Timeline impact:** None — no sprint schedule change

## 4. Detailed Changes

### docker-compose.yml

Added 7 Supabase services to the existing 3 application services:

| Service | Image | Purpose | Exposed Port |
|---|---|---|---|
| `db` | `supabase/postgres:15.8.1.085` | PostgreSQL with Supabase extensions | — (internal) |
| `auth` | `supabase/gotrue:v2.186.0` | Auth (magic links, JWT) | — (via Kong) |
| `rest` | `postgrest/postgrest:v14.8` | REST API for DB | — (via Kong) |
| `kong` | `kong/kong:3.9.1` | Supabase API gateway | **8000** |
| `meta` | `supabase/postgres-meta:v0.96.3` | DB metadata (for Studio) | — (internal) |
| `studio` | `supabase/studio:2026.04.08-sha-205cbe7` | Dashboard UI | **54323** |
| `inbucket` | `inbucket/inbucket:3.0.4` | Email capture for magic links | **54324** |

Key design decisions:
- YAML `x-supabase-defaults` with anchors define each secret once with `${VAR:-default}` fallback — zero-config on fresh clone
- SPA receives `SUPABASE_URL=http://localhost:8000` (browser-accessible); API receives `http://kong:8000` (internal Docker network)
- GoTrue sends emails via Inbucket SMTP — magic link emails viewable at `http://localhost:54324`
- App migration auto-applies on first DB start via init script mount
- Analytics/Logflare skipped — Studio runs with `NEXT_PUBLIC_ENABLE_LOGS=false`
- DB data persisted in named volume `supabase-db-data`

### docker/supabase/ (4 new files)

- `kong.yml` — Stripped Kong declarative config: auth + REST + meta routes only (no realtime, storage, functions, analytics, dashboard)
- `kong-entrypoint.sh` — Env var substitution for Kong config at startup
- `roles.sql` — Sets passwords on pre-existing Supabase Postgres roles
- `jwt.sql` — Configures JWT secret in Postgres settings

### .env.example (root)

Replaced external-Supabase variables with self-hosted secrets:
- `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRY`
- `ANON_KEY`, `SERVICE_ROLE_KEY` (official demo JWTs)
- `PG_META_CRYPTO_KEY`
- Port configuration: `KONG_HTTP_PORT`, `STUDIO_PORT`, `INBUCKET_PORT`
- LLM provider vars unchanged

### architecture.md

Docker Compose Structure section rewritten with:
- Full 10-service topology table
- Network diagram showing port routing
- URL configuration documentation (SPA vs API Supabase URLs)
- Updated dev vs production environment description

## 5. Implementation Handoff

**Scope:** Minor — all changes implemented directly in this session.
**Handoff:** No further action required. Changes are ready for commit.

### Access Points After `docker compose up`

| Service | URL |
|---|---|
| Application | http://localhost |
| Supabase API (Kong) | http://localhost:8000 |
| Studio Dashboard | http://localhost:54323 |
| Inbucket (emails) | http://localhost:54324 |
