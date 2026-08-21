CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'cash', 'investment', 'credit');--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "type" "account_type" DEFAULT 'checking' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "opening_balance" integer DEFAULT 0 NOT NULL;