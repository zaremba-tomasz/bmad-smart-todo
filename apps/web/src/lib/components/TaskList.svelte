<script lang="ts">
  import type { Task } from '@smart-todo/shared'
  import { onDestroy } from 'svelte'

  import TaskItem from '$lib/components/TaskItem.svelte'

  let {
    tasks,
    completedCount,
    onComplete,
    onUncomplete,
  }: {
    tasks: Task[]
    completedCount: number
    onComplete: (id: string) => void
    onUncomplete: (id: string) => void
  } = $props()

  let announcementText = $state('')
  let announcementTimer: ReturnType<typeof setTimeout> | undefined
  let pendingAnnouncementDelta = $state(0)
  let lastKnownCompletedCount = $state<number | null>(null)

  function reconcileAnnouncementDelta() {
    if (lastKnownCompletedCount === null) {
      lastKnownCompletedCount = completedCount
      return
    }

    const reflectedDelta = completedCount - lastKnownCompletedCount
    if (reflectedDelta !== 0) {
      pendingAnnouncementDelta -= reflectedDelta
      lastKnownCompletedCount = completedCount
    }
  }

  function announce(message: string) {
    clearTimeout(announcementTimer)
    announcementText = message
    announcementTimer = setTimeout(() => { announcementText = '' }, 1000)
  }

  function handleComplete(id: string) {
    reconcileAnnouncementDelta()
    pendingAnnouncementDelta += 1
    const nextCompletedCount = Math.max(0, completedCount + pendingAnnouncementDelta)
    announce(`Task completed. ${nextCompletedCount} tasks completed.`)
    onComplete(id)
  }

  function handleUncomplete(id: string) {
    reconcileAnnouncementDelta()
    pendingAnnouncementDelta -= 1
    const nextCompletedCount = Math.max(0, completedCount + pendingAnnouncementDelta)
    announce(`Task reopened. ${nextCompletedCount} tasks completed.`)
    onUncomplete(id)
  }

  onDestroy(() => {
    clearTimeout(announcementTimer)
  })
</script>

<div role="status" aria-live="polite" class="sr-only">
  {announcementText}
</div>

<ul role="list" aria-label="Task list">
  {#each tasks as task (task.id)}
    <li>
      <TaskItem
        {task}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
      />
    </li>
  {/each}
</ul>

{#if completedCount > 0}
  <p class="mt-4 text-[length:var(--font-size-quiet)] font-[number:var(--font-weight-quiet)] leading-[var(--line-height-quiet)] text-text-secondary">
    <span class="text-amber-400">{completedCount}</span> completed
  </p>
{/if}
