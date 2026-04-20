<script lang="ts">
  import { onMount } from 'svelte'
  import type { User } from '@supabase/supabase-js'

  import EmptyState from '$lib/components/EmptyState.svelte'
  import SyncIndicator from '$lib/components/SyncIndicator.svelte'
  import TaskList from '$lib/components/TaskList.svelte'
  import { taskStore } from '$lib/stores/task-store.svelte'

  let { user, onLogout }: {
    user: User
    onLogout: () => void
  } = $props()

  onMount(() => {
    taskStore.loadTasks()
  })
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

  <div class="app-shell__sync-banner px-4 md:px-6">
    <div class="mx-auto w-full max-w-xl">
      <SyncIndicator mode="banner" />
    </div>
  </div>

  <main
    id="task-list"
    tabindex="-1"
    class="app-shell__main min-h-0 overflow-y-auto px-4 pb-24 outline-none md:px-6 md:pb-0"
  >
    <div class="mx-auto w-full max-w-xl">
      {#if taskStore.loading}
        <p class="py-16 text-center text-[length:var(--font-size-quiet)] text-text-tertiary">
          Loading…
        </p>
      {:else if taskStore.error !== null}
        <div class="py-12 text-center">
          <p class="text-[length:var(--font-size-quiet)] text-text-secondary">
            Couldn&apos;t load tasks. Please try again.
          </p>
          <button
            type="button"
            class="mt-3 rounded-lg border border-border-default px-4 py-2 text-[length:var(--font-size-quiet)] text-text-secondary transition-colors motion-reduce:transition-none hover:border-border-focus hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
            onclick={() => taskStore.loadTasks()}
          >
            Retry
          </button>
        </div>
      {:else if taskStore.tasks.length === 0}
        <EmptyState />
      {:else}
        <TaskList
          tasks={taskStore.tasks}
          completedCount={taskStore.completedCount}
          onComplete={(id) => taskStore.completeTask(id)}
          onUncomplete={(id) => taskStore.uncompleteTask(id)}
        />
      {/if}
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
      "sync-banner"
      "main";
    grid-template-rows: auto auto auto minmax(0, 1fr);
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

  .app-shell__sync-banner {
    grid-area: sync-banner;
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
        "sync-banner"
        "main";
      grid-template-rows: auto auto auto auto minmax(0, 1fr);
    }
  }
</style>
