-- Migration: Adicionando preferências do usuário

-- Adicionando colunas de preferências
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "theme" text NOT NULL DEFAULT 'dark';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" text NOT NULL DEFAULT 'pt-BR';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifications" boolean NOT NULL DEFAULT true;

-- Adicionando colunas de preferências de budget
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "budget_default_month" integer;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "budget_default_year" integer;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "budget_default_context" "context" DEFAULT 'individual';