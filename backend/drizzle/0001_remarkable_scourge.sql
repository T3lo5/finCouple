CREATE TYPE "public"."budget_category" AS ENUM('dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"category" "budget_category" NOT NULL,
	"limit_amount" numeric(12, 2) NOT NULL,
	"spent_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"alert_threshold" numeric(5, 2) DEFAULT '80.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_budget_id_monthly_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."monthly_budgets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
