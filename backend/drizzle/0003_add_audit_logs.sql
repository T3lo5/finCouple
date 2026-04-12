-- Add audit logs table for tracking profile changes
-- Migration: 0003_add_audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "action" text NOT NULL,
  "entity" text DEFAULT 'user' NOT NULL,
  "entity_id" text,
  "old_values" text,
  "new_values" text,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT NOW() NOT NULL
);

-- Create index on user_id and created_at for efficient querying
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
