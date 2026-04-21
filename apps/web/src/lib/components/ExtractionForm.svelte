<script lang="ts">
  import { onDestroy } from 'svelte'

  import { captureStore } from '$lib/stores/capture-store.svelte.js'
  import { formatRelativeDate } from '$lib/utils/format.js'

  const priorityClasses: Record<string, string> = {
    urgent: 'bg-coral-500 text-white',
    high: 'bg-coral-100 text-coral-600 border border-coral-500/50',
    medium: 'bg-amber-100 text-amber-900 border border-amber-500/50',
    low: 'bg-shimmer-base text-text-secondary border border-border-default',
  }

  const priorityOptions = ['low', 'medium', 'high', 'urgent'] as const
  type PriorityValue = (typeof priorityOptions)[number] | null

  let showShimmer = $state(false)
  let shimmerTimer: ReturnType<typeof setTimeout> | undefined

  let title = $state('')
  let dueDate = $state<string | null>(null)
  let dueTime = $state<string | null>(null)
  let priority = $state<PriorityValue>(null)
  let location = $state<string | null>(null)

  let editedFields = $state(new Set<string>())
  let showAddControls = $state(false)
  let addControlsTimer: ReturnType<typeof setTimeout> | undefined
  let addedFields = $state(new Set<string>())

  let titleError = $state('')
  let titleInput: HTMLInputElement | undefined = $state()

  let revealed = $state(false)
  let revealTimer: ReturnType<typeof setTimeout> | undefined

  $effect(() => {
    if (captureStore.state === 'extracting') {
      showShimmer = false
      shimmerTimer = setTimeout(() => {
        showShimmer = true
        captureStore.setAnnouncement('Processing your task...')
      }, 800)
    } else {
      showShimmer = false
      if (shimmerTimer) clearTimeout(shimmerTimer)
    }
  })

  $effect(() => {
    if (captureStore.state === 'extracted' && captureStore.extractedFields) {
      const fields = captureStore.extractedFields
      title = fields.title
      dueDate = fields.dueDate
      dueTime = fields.dueTime
      priority = fields.priority
      location = fields.location
      editedFields = new Set()
      addedFields = new Set()
      showAddControls = false
      titleError = ''

      revealed = false
      if (revealTimer) clearTimeout(revealTimer)
      revealTimer = setTimeout(() => { revealed = true }, 10)

      if (addControlsTimer) clearTimeout(addControlsTimer)
      addControlsTimer = setTimeout(() => { showAddControls = true }, 500)

      const parts = [`Title: ${fields.title}`]
      if (fields.dueDate) parts.push(`Due: ${formatRelativeDate(fields.dueDate)}`)
      if (fields.dueTime) parts.push(`Time: ${fields.dueTime}`)
      if (fields.priority) parts.push(`Priority: ${fields.priority}`)
      if (fields.location) parts.push(`Location: ${fields.location}`)
      captureStore.setAnnouncement(`Task details extracted. ${parts.join('. ')}.`)
    }
  })

  onDestroy(() => {
    if (shimmerTimer) clearTimeout(shimmerTimer)
    if (addControlsTimer) clearTimeout(addControlsTimer)
    if (revealTimer) clearTimeout(revealTimer)
  })

  function handleFieldEdit(field: 'title' | 'dueDate' | 'dueTime' | 'priority' | 'location', value: string | null) {
    editedFields = new Set([...editedFields, field])
    captureStore.updateField(field, value)
  }

  async function handleSave() {
    const trimmed = title.trim()
    if (!trimmed) {
      titleError = 'Title is required'
      titleInput?.focus()
      return
    }
    titleError = ''

    captureStore.updateField('title', title)
    captureStore.updateField('dueDate', dueDate)
    captureStore.updateField('dueTime', dueTime)
    captureStore.updateField('priority', priority)
    captureStore.updateField('location', location)

    const didSave = captureStore.saveTask()
    if (!didSave) return

    const viewport = typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 768px)').matches
      ? 'desktop'
      : 'mobile'
    const captureInput = document.querySelector<HTMLInputElement>(`input[data-capture-input="${viewport}"]`)
    captureInput?.focus()
  }

  function fieldBg(field: string): string {
    return editedFields.has(field) ? 'bg-surface-raised' : 'bg-surface-extracted'
  }

  let isSaving = $derived(captureStore.state === 'saving')
  let isExtracting = $derived(captureStore.state === 'extracting')
  let isExtracted = $derived(captureStore.state === 'extracted' || captureStore.state === 'saving')
</script>

{#if isExtracting}
  <div class="extraction-form-container mt-3 rounded-xl border border-border-default p-4" style="min-height: 120px;">
    {#if showShimmer}
      <div
        class="shimmer space-y-3 motion-reduce:hidden"
        aria-hidden="true"
      >
        <div class="h-8 rounded-lg shimmer-bar"></div>
        <div class="h-6 w-3/4 rounded-lg shimmer-bar"></div>
        <div class="h-10 rounded-lg shimmer-bar"></div>
      </div>
      <p class="hidden text-text-secondary text-[length:var(--font-size-quiet)] motion-reduce:block">
        Processing...
      </p>
    {/if}
  </div>
{/if}

{#if isExtracted}
  <div
    class="extraction-form mt-3 rounded-xl border border-border-default p-4 space-y-3 transition-opacity duration-[var(--duration-reveal)] ease-out motion-reduce:transition-none"
    class:opacity-0={!revealed}
    class:translate-y-1={!revealed}
    class:opacity-100={revealed}
    class:translate-y-0={revealed}
    role="form"
    aria-label="Extracted task details"
  >
    <!-- Title (always shown) -->
    <div class="space-y-1">
      <label for="ef-title" class="block text-[length:var(--font-size-quiet)] font-medium text-text-secondary">
        Title
      </label>
      <input
        id="ef-title"
        type="text"
        bind:this={titleInput}
        bind:value={title}
        oninput={() => { handleFieldEdit('title', title); titleError = '' }}
        disabled={isSaving}
        aria-describedby={titleError ? 'ef-title-error' : undefined}
        class="w-full rounded-lg border border-border-default px-3 py-2 text-[length:var(--font-size-input)] leading-[var(--line-height-input)] text-text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none {fieldBg('title')}"
      />
      {#if titleError}
        <p id="ef-title-error" role="alert" class="text-coral-500 text-[length:var(--font-size-quiet)]">
          {titleError}
        </p>
      {/if}
    </div>

    <!-- Due Date (conditional) -->
    {#if dueDate !== null || addedFields.has('dueDate')}
      <div class="space-y-1">
        <label for="ef-date" class="block text-[length:var(--font-size-quiet)] font-medium text-text-secondary">
          Due date
        </label>
        {#if !editedFields.has('dueDate') && dueDate !== null}
          <button
            type="button"
            id="ef-date"
            onclick={() => { editedFields = new Set([...editedFields, 'dueDate']) }}
            class="w-full rounded-lg border border-border-default px-3 py-2 text-left text-[length:var(--font-size-input)] leading-[var(--line-height-input)] text-text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none {fieldBg('dueDate')}"
          >
            {formatRelativeDate(dueDate)}
          </button>
        {:else}
          <input
            id="ef-date"
            type="date"
            value={dueDate ?? ''}
            oninput={(e) => { const v = (e.target as HTMLInputElement).value; dueDate = v || null; handleFieldEdit('dueDate', dueDate) }}
            disabled={isSaving}
            class="w-full rounded-lg border border-border-default px-3 py-2 text-[length:var(--font-size-input)] leading-[var(--line-height-input)] text-text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none {fieldBg('dueDate')}"
          />
        {/if}
      </div>
    {/if}

    <!-- Due Time (conditional) -->
    {#if dueTime !== null || addedFields.has('dueTime')}
      <div class="space-y-1">
        <label for="ef-time" class="block text-[length:var(--font-size-quiet)] font-medium text-text-secondary">
          Due time
        </label>
        {#if !editedFields.has('dueTime') && dueTime !== null}
          <button
            type="button"
            id="ef-time"
            onclick={() => { editedFields = new Set([...editedFields, 'dueTime']) }}
            class="w-full rounded-lg border border-border-default px-3 py-2 text-left text-[length:var(--font-size-input)] leading-[var(--line-height-input)] text-text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none {fieldBg('dueTime')}"
          >
            {dueTime}
          </button>
        {:else}
          <input
            id="ef-time"
            type="time"
            value={dueTime ?? ''}
            oninput={(e) => { const v = (e.target as HTMLInputElement).value; dueTime = v || null; handleFieldEdit('dueTime', dueTime) }}
            disabled={isSaving}
            class="w-full rounded-lg border border-border-default px-3 py-2 text-[length:var(--font-size-input)] leading-[var(--line-height-input)] text-text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none {fieldBg('dueTime')}"
          />
        {/if}
      </div>
    {/if}

    <!-- Priority (conditional) -->
    {#if priority !== null || addedFields.has('priority')}
      <div class="space-y-1">
        <label for="ef-priority" class="block text-[length:var(--font-size-quiet)] font-medium text-text-secondary">
          Priority
        </label>
        {#if !editedFields.has('priority') && priority !== null}
          <button
            type="button"
            id="ef-priority"
            onclick={() => { editedFields = new Set([...editedFields, 'priority']) }}
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none {priorityClasses[priority] ?? ''}"
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </button>
        {:else}
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Priority options">
            {#each priorityOptions as opt (opt)}
              <button
                type="button"
                id={opt === priorityOptions[0] ? 'ef-priority' : undefined}
                onclick={() => { priority = priority === opt ? null : opt; handleFieldEdit('priority', priority) }}
                aria-pressed={priority === opt}
                disabled={isSaving}
                class="rounded-full px-3 py-1 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none {priority === opt ? priorityClasses[opt] : 'bg-shimmer-base text-text-secondary border border-border-default'}"
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Location (conditional) -->
    {#if location !== null || addedFields.has('location')}
      <div class="space-y-1">
        <label for="ef-location" class="block text-[length:var(--font-size-quiet)] font-medium text-text-secondary">
          Location
        </label>
        <input
          id="ef-location"
          type="text"
          value={location ?? ''}
          oninput={(e) => { location = (e.target as HTMLInputElement).value || null; handleFieldEdit('location', location) }}
          disabled={isSaving}
          class="w-full rounded-lg border border-border-default px-3 py-2 text-[length:var(--font-size-input)] leading-[var(--line-height-input)] text-text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none {fieldBg('location')}"
        />
      </div>
    {/if}

    <!-- "+ Add" controls -->
    {#if showAddControls}
      <div
        class="flex flex-wrap gap-2 transition-opacity duration-[500ms] motion-reduce:transition-none"
        class:opacity-0={!showAddControls}
        class:opacity-100={showAddControls}
      >
        {#if dueDate === null && !addedFields.has('dueDate')}
          <button
            type="button"
            onclick={() => { addedFields = new Set([...addedFields, 'dueDate']); editedFields = new Set([...editedFields, 'dueDate']) }}
            class="text-[length:var(--font-size-quiet)] text-text-tertiary transition-colors motion-reduce:transition-none hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            + Add date
          </button>
        {/if}
        {#if dueTime === null && !addedFields.has('dueTime')}
          <button
            type="button"
            onclick={() => { addedFields = new Set([...addedFields, 'dueTime']); editedFields = new Set([...editedFields, 'dueTime']) }}
            class="text-[length:var(--font-size-quiet)] text-text-tertiary transition-colors motion-reduce:transition-none hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            + Add time
          </button>
        {/if}
        {#if priority === null && !addedFields.has('priority')}
          <button
            type="button"
            onclick={() => { addedFields = new Set([...addedFields, 'priority']); editedFields = new Set([...editedFields, 'priority']) }}
            class="text-[length:var(--font-size-quiet)] text-text-tertiary transition-colors motion-reduce:transition-none hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            + Add priority
          </button>
        {/if}
        {#if location === null && !addedFields.has('location')}
          <button
            type="button"
            onclick={() => { addedFields = new Set([...addedFields, 'location']); editedFields = new Set([...editedFields, 'location']) }}
            class="text-[length:var(--font-size-quiet)] text-text-tertiary transition-colors motion-reduce:transition-none hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            + Add location
          </button>
        {/if}
      </div>
    {/if}

    <!-- Save button -->
    <button
      type="button"
      onclick={handleSave}
      class="w-full rounded-lg bg-coral-500 py-3 text-center font-medium text-white transition-colors motion-reduce:transition-none hover:bg-coral-600 focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {isSaving ? 'Saving...' : 'Save'}
    </button>
  </div>
{/if}

<style>
  @keyframes shimmer-breathe {
    0%, 100% { background-color: var(--color-shimmer-base); }
    50% { background-color: var(--color-shimmer-highlight); }
  }

  .shimmer-bar {
    animation: shimmer-breathe var(--duration-breathe) ease-in-out infinite;
  }
</style>
