## Deferred from: code review of 2-3-basic-task-list-and-empty-state.md (2026-04-20)

- Sync dot touch target compliance vs "do not modify SyncIndicator" constraint (`apps/web/src/lib/components/SyncIndicator.svelte`) — AC #6 expects 44x44 touch targets, but changing dot button size conflicts with this story's scope note. Reason: Following story note regarding scope of story.
