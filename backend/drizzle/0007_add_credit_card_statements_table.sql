CREATE TABLE IF NOT EXISTS "credit_card_statements" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"user_id" text NOT NULL,
	"statement_date" timestamp NOT NULL,
	"due_due_date" timestamp NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"minimum_payment" numeric(12, 2),
	"paid_amount" numeric(12, 2) DEFAULT '0',
	"is_paid" boolean DEFAULT false NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "credit_limit" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "closing_date" timestamp;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD COLUMN "frequency" "frequency" DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE "savings_goals" ADD COLUMN "next_target_date" timestamp;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD COLUMN "original_target_amount" numeric(12, 2);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_card_statements" ADD CONSTRAINT "credit_card_statements_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_card_statements" ADD CONSTRAINT "credit_card_statements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
