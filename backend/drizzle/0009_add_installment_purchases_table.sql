CREATE TABLE IF NOT EXISTS "installment_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"couple_id" text,
	"account_id" text,
	"title" text NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"installment_count" integer NOT NULL,
	"current_installment" integer NOT NULL DEFAULT 1,
	"installment_amount" numeric(12, 2) NOT NULL,
	"start_date" timestamp NOT NULL,
	"next_due_date" timestamp NOT NULL,
	"category" text DEFAULT 'shopping' NOT NULL,
	"context" text DEFAULT 'individual' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installment_purchases" ADD CONSTRAINT "installment_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installment_purchases" ADD CONSTRAINT "installment_purchases_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installment_purchases" ADD CONSTRAINT "installment_purchases_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;