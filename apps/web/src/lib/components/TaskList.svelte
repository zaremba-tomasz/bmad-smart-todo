<script lang="ts">
  import type { Task } from '@smart-todo/shared'

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
</script>

<ul role="list" aria-label="Task list">
  {#each tasks as task (task.id)}
    <li>
      <TaskItem
        {task}
        {onComplete}
        {onUncomplete}
      />
    </li>
  {/each}
</ul>

{#if completedCount > 0}
  <p class="mt-4 text-[length:var(--font-size-quiet)] font-[number:var(--font-weight-quiet)] leading-[var(--line-height-quiet)] text-text-secondary">
    <span class="text-amber-400">{completedCount}</span> completed
  </p>
{/if}
