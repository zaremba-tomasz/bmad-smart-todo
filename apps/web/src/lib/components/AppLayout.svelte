<script lang="ts">
  import type { User } from '@supabase/supabase-js'

  let { user, onLogout }: {
    user: User
    onLogout: () => void
  } = $props()
</script>

<a
  href="#task-list"
  class="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-surface-raised focus-visible:px-4 focus-visible:py-2 focus-visible:text-text-primary focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
>
  Skip to task list
</a>

<div class="app-shell min-h-screen overflow-hidden">
  <header class="app-shell__header px-4 py-3 md:px-6">
    <div class="mx-auto flex w-full max-w-xl items-center justify-between gap-3">
      <h1 class="text-[length:var(--font-size-loud)] font-[number:var(--font-weight-loud)] leading-[var(--line-height-loud)] text-text-primary">
        Smart Todo
      </h1>
      <div class="flex items-center gap-3">
        <span class="hidden text-[length:var(--font-size-quiet)] text-text-secondary md:inline">
          {user.email}
        </span>
        <button
          type="button"
          onclick={onLogout}
          class="rounded-lg border border-border-default px-4 py-2 text-[length:var(--font-size-quiet)] text-text-secondary transition-colors motion-reduce:transition-none hover:border-border-focus hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Sign out
        </button>
      </div>
    </div>
  </header>

  <div class="app-shell__capture-desktop hidden px-4 md:block md:px-6" aria-hidden="true">
    <div class="mx-auto flex h-14 w-full max-w-xl items-center rounded-lg border border-border-default bg-surface-raised px-4 shadow-sm">
      <span class="text-[length:var(--font-size-input)] text-text-tertiary">Add a task…</span>
    </div>
  </div>

  <nav aria-label="Group filters" class="app-shell__nav px-4 py-2 md:px-6">
    <div class="mx-auto w-full max-w-xl">
      <span class="sr-only">Group filters placeholder</span>
    </div>
  </nav>

  <main
    id="task-list"
    tabindex="-1"
    class="app-shell__main min-h-0 overflow-y-auto px-4 pb-24 outline-none md:px-6 md:pb-0"
  >
    <div class="mx-auto w-full max-w-xl py-16">
      <p class="text-center text-[length:var(--font-size-quiet)] text-text-tertiary">
        Tasks will appear here
      </p>
    </div>
  </main>

  <div
    class="fixed inset-x-0 bottom-0 border-t border-border-default bg-surface-raised md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom, 0px);"
    aria-hidden="true"
  >
    <div class="mx-auto flex h-14 w-full max-w-xl items-center px-4">
      <span class="text-[length:var(--font-size-input)] text-text-tertiary">Add a task…</span>
    </div>
  </div>
</div>

<style>
  .app-shell {
    display: grid;
    grid-template-areas:
      "header"
      "nav"
      "main";
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .app-shell__header {
    grid-area: header;
  }

  .app-shell__capture-desktop {
    grid-area: capture;
  }

  .app-shell__nav {
    grid-area: nav;
  }

  .app-shell__main {
    grid-area: main;
  }

  @media (min-width: 768px) {
    .app-shell {
      grid-template-areas:
        "header"
        "capture"
        "nav"
        "main";
      grid-template-rows: auto auto auto minmax(0, 1fr);
    }
  }
</style>
