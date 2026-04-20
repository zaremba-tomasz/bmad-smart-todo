# Smart Todo

A smart todo application built with Svelte 5, Fastify, and Supabase in a Turborepo monorepo.

## Prerequisites

- Node.js 24+
- pnpm 10+
- Docker (required for local Supabase)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start local Supabase (requires Docker — applies migrations automatically)
pnpm supabase start

# Start development servers (web on :5173, api on :3001)
pnpm dev

# Run all tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build all packages
pnpm build
```

## Local Supabase

The project uses Supabase for authentication and database. A local instance runs via Docker.

```bash
# Start local Supabase (first run downloads Docker images — may take a few minutes)
pnpm supabase start

# View local service URLs and keys
pnpm supabase status

# Stop local Supabase
pnpm supabase stop

# Create a new migration
pnpm supabase migration new <migration_name>

# Apply migrations to local database
pnpm supabase db push

# Check for schema drift (should output nothing if migrations are up to date)
pnpm supabase db diff --schema public
```

**Local service URLs (after `supabase start`):**

| Service | URL |
|---------|-----|
| API | http://localhost:54321 |
| Studio (DB admin) | http://localhost:54323 |
| Inbucket (email) | http://localhost:54324 |

Magic link emails sent during local development are captured by Inbucket.
Open http://localhost:54324 to view them and click the magic link.

### Database Schema

The `tasks` table is created by the initial migration with Row Level Security (RLS) enabled.
RLS policies enforce user isolation — each user can only access their own tasks.

### Schema Change Policy

All database schema changes MUST go through migration files (`supabase/migrations/`).
Direct edits via the Supabase Dashboard are prohibited. CI runs `supabase db diff`
to detect uncommitted schema drift.

## Project Structure

```
├── apps/
│   ├── web/          # Svelte 5 + Vite SPA (@smart-todo/web)
│   └── api/          # Fastify BFF API (@smart-todo/api)
├── packages/
│   ├── shared/       # Zod schemas and shared types (@smart-todo/shared)
│   └── config/       # Shared ESLint and TypeScript config (@smart-todo/config)
├── e2e/              # Playwright E2E tests (@smart-todo/e2e)
├── supabase/
│   ├── config.toml   # Local Supabase configuration
│   ├── migrations/   # Versioned SQL migrations
│   └── seed.sql      # Dev seed data and auth documentation
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM |
| `OPENROUTER_MODEL` | OpenRouter model identifier |
| `LM_STUDIO_URL` | LM Studio local URL |
| `LLM_PROVIDER` | LLM provider selection |

For local development, `SUPABASE_URL` and keys are printed by `pnpm supabase status`.

## Production Auth Configuration

The MVP is restricted to 6 users via email allowlist:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Under "Restrict email sign-ups", add the 6 MVP user email addresses
3. Disable open registration

Local development does not enforce the allowlist — any email works.

## Docker

```bash
docker compose up --build
```

The Docker setup includes:
- **proxy** (Nginx): Routes `/*` to web, `/api/*` to api
- **web**: Multi-stage build serving static files via Nginx
- **api**: Node.js Fastify server
