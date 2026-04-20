<script lang="ts">
  import { taskStore } from '$lib/stores/task-store.svelte'

  let {
    taskId = undefined,
    mode = 'dot',
  }: {
    taskId?: string
    mode?: 'dot' | 'banner'
  } = $props()

  let dismissed = $state(false)

  const STALE_THRESHOLD_MS = 60_000
  const CHECK_INTERVAL_MS = 10_000

  let showStaleBanner = $state(false)
  let intervalId: ReturnType<typeof setInterval> | undefined

  function checkStaleMutations() {
    const now = Date.now()
    const hasStale = taskStore.pendingMutations.some(
      (m) => now - m.createdAt >= STALE_THRESHOLD_MS,
    )
    showStaleBanner = hasStale
    if (!hasStale) {
      dismissed = false
    }
  }

  $effect(() => {
    if (mode === 'banner') {
      checkStaleMutations()
      intervalId = setInterval(checkStaleMutations, CHECK_INTERVAL_MS)
      return () => {
        if (intervalId) clearInterval(intervalId)
      }
    }
  })

  function handleDotClick() {
    if (taskId) {
      taskStore.retryMutation(taskId)
    }
  }

  function handleDismiss() {
    dismissed = true
  }
</script>

{#if mode === 'dot' && taskId && taskStore.getSyncStatus(taskId) === 'pending'}
  <button
    type="button"
    class="inline-flex h-3 w-3 items-center justify-center rounded-full bg-current text-text-tertiary"
    aria-label="Sync pending, tap to retry"
    onclick={handleDotClick}
  ></button>
{/if}

{#if mode === 'banner' && showStaleBanner && !dismissed && taskStore.hasPendingMutations}
  <div
    role="status"
    aria-live="polite"
    class="flex items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-[length:var(--font-size-quiet)] text-text-secondary"
  >
    <span>Some tasks haven't synced yet</span>
    <button
      type="button"
      class="text-text-tertiary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:outline-none"
      aria-label="Dismiss sync notification"
      onclick={handleDismiss}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    </button>
  </div>
{/if}
