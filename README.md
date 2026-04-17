# Smart Todo

A smart todo application built with Svelte 5, Fastify, and Supabase in a Turborepo monorepo.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Getting Started

```bash
# Install dependencies
pnpm install

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

## Project Structure

```
├── apps/
│   ├── web/          # Svelte 5 + Vite SPA (@smart-todo/web)
│   └── api/          # Fastify BFF API (@smart-todo/api)
├── packages/
│   ├── shared/       # Zod schemas and shared types (@smart-todo/shared)
│   └── config/       # Shared ESLint and TypeScript config (@smart-todo/config)
├── e2e/              # Playwright E2E tests (@smart-todo/e2e)
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

## Docker

```bash
docker compose up --build
```

The Docker setup includes:
- **proxy** (Nginx): Routes `/*` to web, `/api/*` to api
- **web**: Multi-stage build serving static files via Nginx
- **api**: Node.js Fastify server
