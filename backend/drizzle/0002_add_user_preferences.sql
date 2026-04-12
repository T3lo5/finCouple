-- Add user preferences columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "theme" text DEFAULT 'dark' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'pt-BR' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifications" boolean DEFAULT true NOT NULL;
