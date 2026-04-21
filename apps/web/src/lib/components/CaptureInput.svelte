<script lang="ts" module>
  let captureInputInstanceCounter = 0
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  import { captureStore } from '$lib/stores/capture-store.svelte.js'

  let { autofocus = false }: { autofocus?: boolean } = $props()

  let inputRef: HTMLInputElement
  let mobileContainer: HTMLDivElement | undefined
  let cleanupViewport: (() => void) | undefined
  const descriptionId = `capture-input-description-${++captureInputInstanceCounter}`

  const isExtracting = $derived(captureStore.state === 'extracting')

  function handleSubmit() {
    if (!inputRef.value.trim()) return
    captureStore.submitForExtraction(inputRef.value)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.isComposing) return

    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    const isDesktopViewport = typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 768px)').matches
      : true

    if (!autofocus || !isDesktopViewport) {
      return
    }

    const target = e.target as HTMLElement
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return

    if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault()
      inputRef?.focus()
    }
  }

  onMount(() => {
    const isDesktopViewport = typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 768px)').matches
      : true

    if (autofocus && isDesktopViewport) {
      inputRef.focus()
    }

    if (!autofocus && mobileContainer && typeof window.visualViewport !== 'undefined') {
      const vv = window.visualViewport!
      const container = mobileContainer
      const handleResize = () => {
        const offset = window.innerHeight - vv.height - vv.offsetTop
        container.style.transform = `translateY(-${Math.max(0, offset)}px)`
      }
      vv.addEventListener('resize', handleResize)
      cleanupViewport = () => vv.removeEventListener('resize', handleResize)
    }
  })

  onDestroy(() => {
    cleanupViewport?.()
  })
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div bind:this={mobileContainer}>
  <span id={descriptionId} class="sr-only">
    Type a task in natural language, for example: Call the dentist next Monday, high priority
  </span>
  <form
    class="relative flex items-center"
    onsubmit={(e) => { e.preventDefault(); handleSubmit() }}
  >
    <input
      bind:this={inputRef}
      type="text"
      value={captureStore.rawInput}
      oninput={(e) => captureStore.setRawInput(e.currentTarget.value)}
      onkeydown={handleKeydown}
      placeholder="Call the dentist next Monday, high priority"
      aria-label="Add a task"
      aria-describedby={descriptionId}
      disabled={isExtracting}
      class="h-14 w-full rounded-lg border border-border-default bg-surface-raised pr-12 pl-4 text-[length:var(--font-size-input)] font-[number:var(--font-weight-input)] leading-[var(--line-height-input)] text-text-primary shadow-sm transition-opacity duration-[var(--duration-reveal)] placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none"
      class:opacity-50={isExtracting}
    />
    <button
      type="submit"
      aria-label="Submit task"
      disabled={isExtracting}
      class="absolute right-2 flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition-colors duration-[var(--duration-snap)] hover:text-coral-500 focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </button>
  </form>
</div>
