<script lang="ts">
  import { captureStore } from '$lib/stores/capture-store.svelte.js'

  const isVisible = $derived(
    captureStore.state === 'extracting'
    || captureStore.state === 'extracted'
    || captureStore.state === 'saving',
  )
</script>

{#if isVisible}
  <p class="text-[length:var(--font-size-quiet)] text-text-secondary" data-testid="ai-indicator">
    Powered by AI
  </p>
{/if}
