ALTER TABLE "accounts" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "type" SET DEFAULT 'savings'::text;--> statement-breakpoint
DROP TYPE "public"."account_type";--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('savings', 'cash', 'wallet', 'investment', 'fixed_deposit', 'ppf', 'epf', 'credit', 'loan');--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "type" SET DEFAULT 'savings'::"public"."account_type";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "type" SET DATA TYPE "public"."account_type" USING "type"::"public"."account_type";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "opening_balance" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "budgets" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "debt_payments" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "debts" ALTER COLUMN "principal" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "debts" ALTER COLUMN "minimum_payment" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "goal_contributions" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "target_amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE bigint;