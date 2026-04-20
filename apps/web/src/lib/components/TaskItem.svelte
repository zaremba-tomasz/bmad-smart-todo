<script lang="ts">
  import { Checkbox } from 'bits-ui'
  import type { Task } from '@smart-todo/shared'

  import SyncIndicator from '$lib/components/SyncIndicator.svelte'
  import { formatRelativeDate } from '$lib/utils/format'

  let {
    task,
    onComplete,
    onUncomplete,
  }: {
    task: Task
    onComplete: (id: string) => void
    onUncomplete: (id: string) => void
  } = $props()

  const priorityClasses: Record<string, string> = {
    urgent: 'bg-coral-500 text-white',
    high: 'bg-coral-100 text-coral-600 border border-coral-500/50',
    medium: 'bg-amber-100 text-amber-900 border border-amber-500/50',
    low: 'bg-shimmer-base text-text-secondary border border-border-default',
  }

  function handleCheckedChange(checked: boolean | 'indeterminate') {
    if (checked === true) onComplete(task.id)
    else if (checked === false) onUncomplete(task.id)
  }

  let formattedDate = $derived(formatRelativeDate(task.dueDate))

  let metadataItems = $derived.by(() => {
    const items: Array<{ type: string; value: string }> = []
    if (formattedDate) items.push({ type: 'date', value: formattedDate })
    if (task.priority) items.push({ type: 'priority', value: task.priority })
    if (task.location) items.push({ type: 'location', value: task.location })
    return items
  })
</script>

<div
  class="task-item flex items-center gap-2 border-b border-border-default py-3 animate-[fadeIn_200ms_ease-out] motion-reduce:animate-none"
  class:bg-surface-completed={task.isCompleted}
>
  <div class="flex min-h-[44px] min-w-[44px] items-center justify-center">
    <Checkbox.Root
      checked={task.isCompleted}
      onCheckedChange={handleCheckedChange}
      class="flex h-5 w-5 items-center justify-center rounded border-2 transition-colors motion-reduce:transition-none
        {task.isCompleted ? 'border-amber-500 bg-amber-500' : 'border-border-default hover:border-border-focus'}"
      aria-label="Mark {task.title} as {task.isCompleted ? 'incomplete' : 'complete'}"
    >
      {#snippet children({ checked })}
        {#if checked}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 text-white" aria-hidden="true">
            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
          </svg>
        {/if}
      {/snippet}
    </Checkbox.Root>
  </div>

  <div class="min-w-0 flex-1">
    <p class="text-[length:var(--font-size-loud)] font-[number:var(--font-weight-loud)] leading-[var(--line-height-loud)] {task.isCompleted ? 'text-text-tertiary' : 'text-text-primary'}">
      {task.title}
    </p>

    {#if metadataItems.length > 0}
      <div class="mt-0.5 flex flex-wrap items-center gap-1 text-[length:var(--font-size-quiet)] font-[number:var(--font-weight-quiet)] leading-[var(--line-height-quiet)] text-text-secondary">
        {#each metadataItems as item, i (item.type)}
          {#if i > 0}
            <span aria-hidden="true">·</span>
          {/if}
          {#if item.type === 'date'}
            <span>{item.value}</span>
          {:else if item.type === 'priority'}
            <span class="rounded-full px-2 py-0.5 text-xs font-medium {priorityClasses[item.value] ?? ''}">
              {item.value.charAt(0).toUpperCase() + item.value.slice(1)}
            </span>
          {:else if item.type === 'location'}
            <span>{item.value}</span>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="flex min-h-[44px] min-w-[44px] items-center justify-center">
    <SyncIndicator taskId={task.id} mode="dot" />
  </div>
</div>
