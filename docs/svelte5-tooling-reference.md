# Svelte 5 + Vite Tooling Reference

Resolved tooling issues from Epic 1. This doc captures solutions so future stories don't re-discover them.

## Architecture Decision: Svelte 5 + Vite (No SvelteKit)

This project uses **plain Svelte 5 + Vite as a SPA**, not SvelteKit. This is a deliberate architectural choice — SvelteKit adds routing, SSR, and conventions unnecessary for a single-view app. The trade-off is that several conveniences SvelteKit provides must be configured manually.

## `$lib` Alias

SvelteKit provides `$lib` automatically. In plain Svelte + Vite, configure it manually:

```typescript
// vite.config.ts
resolve: {
  alias: {
    $lib: path.resolve('./src/lib'),
  },
}
```

```json
// tsconfig.json
"paths": {
  "$lib/*": ["./src/lib/*"]
}
```

Both must be set — Vite uses the alias at build time, TypeScript uses it for type checking.

## ESLint and `.svelte.ts` Files

ESLint does not parse `.svelte.ts` files (Svelte 5 runes modules) by default. Add explicit TypeScript parser configuration:

```javascript
// eslint.config.js
{
  files: ['**/*.svelte.ts'],
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      project: null,
    },
  },
}
```

Without this, ESLint silently ignores or misparses store files like `auth-store.svelte.ts`.

## Vitest: Svelte Server Bundle Resolution

Vitest may resolve Svelte to its server-side bundle instead of the browser bundle, causing `lifecycle_function_unavailable` errors when mounting components.

Fix in `vitest.config.ts`:

```typescript
resolve: {
  conditions: ['browser'],
}
```

This tells Vitest to use the browser export conditions when resolving packages, which is required for any test that renders Svelte components.

## Vitest: DOM Environment for Component Tests

Component tests that use `@testing-library/svelte` need a DOM environment. Configure the test environment:

```typescript
// vitest.config.ts
test: {
  environment: 'happy-dom', // or 'jsdom'
}
```

Note: `jsdom` v29 has ESM compatibility issues with Node 20. Prefer `happy-dom` for Svelte component tests.

## `$state` Proxy Objects in Tests

Svelte 5 `$state` creates proxy objects. Standard `toBe` assertions (which use `Object.is`) fail for state comparisons because the proxy is not the same reference as the original object.

```typescript
// ❌ Fails — proxy !== original
expect(store.user).toBe(mockUser)

// ✅ Works — deep equality comparison
expect(store.user).toEqual(mockUser)
```

Use `toEqual` for all state value assertions in tests.

## `$effect` Module Scope Limitation

`$effect` at the top level of a `.svelte.ts` file requires a component context to run. It won't execute at module evaluation time.

**Pattern:** Use an imperative `init()` function called from a component instead of a top-level `$effect`:

```typescript
// auth-store.svelte.ts
export const authStore = {
  // ... state and methods ...
  init() {
    const supabase = getSupabase()
    supabase.auth.onAuthStateChange((_event, newSession) => {
      // update state
    })
  },
}
```

```svelte
<!-- App.svelte -->
<script>
  import { authStore } from '$lib/stores/auth-store.svelte'
  authStore.init()
</script>
```

## Lazy Initialization for Browser Services

Static imports in Svelte execute at module evaluation time, which happens before `await loadConfig()` completes in `main.ts`. Any service that depends on runtime configuration must use lazy initialization:

```typescript
// ❌ Fails — config not loaded yet at module eval time
const client = createClient(getConfig().SUPABASE_URL, ...)

// ✅ Works — deferred until first call (after mount, after config loaded)
let client: SupabaseClient | null = null
export function getSupabase(): SupabaseClient {
  if (!client) {
    const config = getConfig()
    client = createClient(config.SUPABASE_URL!, config.SUPABASE_ANON_KEY!, { ... })
  }
  return client
}
```

This pattern applies to any browser-side service that reads from runtime config.

## Tailwind CSS v4: CSS-First Configuration

Tailwind v4 does **not** use `tailwind.config.js`. All design tokens are defined via `@theme` blocks in CSS:

```css
/* app.css */
@import 'tailwindcss';

@theme {
  --color-surface: #FDFBF7;
  --color-text-primary: #1C1917;
  /* ... */
}
```

The Vite plugin is `@tailwindcss/vite` and must be listed **before** the Svelte plugin in `vite.config.ts`:

```typescript
plugins: [
  tailwindcss(),  // MUST be before svelte()
  svelte(),
],
```

## Component Props: Svelte 5 Runes

Use `$props()` rune, not `export let` (Svelte 4 pattern). Callback props use `on` prefix:

```svelte
<script lang="ts">
  let { user, onLogout }: {
    user: User
    onLogout: () => void
  } = $props()
</script>
```

## ARIA Roles on Semantic HTML

Svelte's a11y checker flags redundant `role` attributes on semantic HTML elements. `<header>`, `<nav>`, `<main>` already carry implicit ARIA roles per the HTML spec. Do not add explicit `role="banner"`, `role="navigation"`, or `role="main"` — `getByRole()` test queries still work with implicit roles.

## shadcn-svelte Without SvelteKit

The `shadcn-svelte` CLI (`pnpm dlx shadcn-svelte@latest init`) assumes SvelteKit. After initialization, verify `components.json` uses the correct `$lib` alias path matching the Vite config, not a SvelteKit magic path. Components are added individually as needed via `pnpm dlx shadcn-svelte@latest add <component>`.
