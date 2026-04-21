import type { Task, CreateTaskRequest } from '@smart-todo/shared'

export type SyncStatus = 'synced' | 'pending'

export type MutationType = 'create' | 'complete' | 'uncomplete'

export interface UpdateMutationPayload {
  id: string
  previousCompletedAt: string | null
}

export type MutationPayload = CreateTaskRequest | UpdateMutationPayload

export interface PendingMutation {
  mutationId: string
  taskId: string
  type: MutationType
  payload: unknown
  createdAt: number
  retryCount: number
}

export type TaskWithSync = Task & {
  syncStatus: SyncStatus
  tempId?: string
}

export type CaptureState = 'idle' | 'extracting' | 'extracted' | 'manual' | 'saving'
