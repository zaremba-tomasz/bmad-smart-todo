<script lang="ts">
  import { onMount } from 'svelte'

  let { isDesktopViewport, onDismiss }: {
    isDesktopViewport: boolean
    onDismiss: () => void
  } = $props()

  let bannerRef: HTMLDivElement | undefined = $state()
  let visible = $state(false)

  const STORAGE_KEY = 'smart-todo:pin-prompt-dismissed'

  onMount(() => {
    if (!isDesktopViewport) return

    let dismissed = false
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      dismissed = false
    }

    if (dismissed) return
    visible = true
  })

  function dismiss() {
    visible = false
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch { /* localStorage unavailable */ }
    onDismiss()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && visible) {
      e.stopPropagation()
      dismiss()
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (!visible || !bannerRef) return
    if (!bannerRef.contains(e.target as Node)) {
      dismiss()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleClickOutside} />

{#if visible}
  <div
    bind:this={bannerRef}
    role="status"
    aria-live="polite"
    class="mt-2 flex items-center justify-between rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-[length:var(--font-size-quiet)]"
    data-testid="pin-prompt"
  >
    <span class="text-text-primary">Pin this tab for quick access</span>
    <button
      type="button"
      onclick={dismiss}
      aria-label="Dismiss pin prompt"
      class="ml-3 flex-shrink-0 text-text-secondary transition-colors motion-reduce:transition-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:outline-none"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
{/if}
