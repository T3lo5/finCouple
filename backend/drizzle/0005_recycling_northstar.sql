-- Migration: Adicionando campos para metas recorrentes e histórico de contribuições

-- Tabela para histórico de contribuições
CREATE TABLE "savings_contributions" (
    "id" text PRIMARY KEY NOT NULL,
    "goal_id" text NOT NULL,
    "user_id" text NOT NULL,
    "amount" numeric(12, 2) NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Adicionando colunas para metas recorrentes
ALTER TABLE "savings_goals" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;
ALTER TABLE "savings_goals" ADD COLUMN "frequency" "frequency" DEFAULT 'monthly';
ALTER TABLE "savings_goals" ADD COLUMN "next_target_date" timestamp;
ALTER TABLE "savings_goals" ADD COLUMN "original_target_amount" numeric(12, 2);

-- Adicionando chaves estrangeiras para a nova tabela
DO $$ BEGIN
    ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_goal_id_savings_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "savings_goals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionando índices para melhorar performance
CREATE INDEX IF NOT EXISTS "savings_contributions_goal_id_idx" ON "savings_contributions" ("goal_id");
CREATE INDEX IF NOT EXISTS "savings_contributions_user_id_idx" ON "savings_contributions" ("user_id");
CREATE INDEX IF NOT EXISTS "savings_contributions_created_at_idx" ON "savings_contributions" ("created_at");

-- Adicionando índice para metas recorrentes
CREATE INDEX IF NOT EXISTS "savings_goals_is_recurring_idx" ON "savings_goals" ("is_recurring");
CREATE INDEX IF NOT EXISTS "savings_goals_next_target_date_idx" ON "savings_goals" ("next_target_date");