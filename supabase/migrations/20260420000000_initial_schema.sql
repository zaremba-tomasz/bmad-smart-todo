-- Initial schema: tasks table with RLS policies
-- Story 1.2: Database Schema & Auth Configuration

-- Create task_priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  due_date date,
  due_time time,
  location text,
  priority task_priority,
  group_id uuid,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user_id ON tasks (user_id);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Deny all access via anon key
CREATE POLICY "tasks_deny_anon" ON tasks
  FOR ALL TO anon
  USING (false);

-- User isolation: SELECT
CREATE POLICY "tasks_select_own" ON tasks
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- User isolation: INSERT
CREATE POLICY "tasks_insert_own" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- User isolation: UPDATE
CREATE POLICY "tasks_update_own" ON tasks
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id);

-- User isolation: DELETE
CREATE POLICY "tasks_delete_own" ON tasks
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
