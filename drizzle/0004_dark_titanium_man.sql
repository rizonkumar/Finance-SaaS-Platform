CREATE TYPE "public"."debt_kind" AS ENUM('loan', 'credit-card', 'other');--> statement-breakpoint
CREATE TABLE "debt_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"debt_id" text NOT NULL,
	"amount" integer NOT NULL,
	"notes" text,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "debt_kind" DEFAULT 'loan' NOT NULL,
	"principal" integer NOT NULL,
	"apr_basis_points" integer DEFAULT 0 NOT NULL,
	"minimum_payment" integer DEFAULT 0 NOT NULL,
	"account_id" text,
	"notes" text,
	"start_date" timestamp NOT NULL,
	"target_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transfer_id" text;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "debt_payments_debt_id_idx" ON "debt_payments" USING btree ("debt_id");--> statement-breakpoint
CREATE INDEX "debt_payments_user_id_idx" ON "debt_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "debts_user_id_idx" ON "debts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "debts_user_name_idx" ON "debts" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "transactions_transfer_id_idx" ON "transactions" USING btree ("transfer_id");