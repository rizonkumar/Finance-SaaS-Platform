CREATE TYPE "public"."rule_match" AS ENUM('contains', 'starts_with', 'equals');--> statement-breakpoint
CREATE TABLE "category_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pattern" text NOT NULL,
	"match" "rule_match" DEFAULT 'contains' NOT NULL,
	"category_id" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_views" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"route" text NOT NULL,
	"query" text DEFAULT '' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_opened_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transaction_splits" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"category_id" text,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"week_starts_on" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_rules" ADD CONSTRAINT "category_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_rules_user_id_idx" ON "category_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_views_user_id_idx" ON "saved_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaction_splits_transaction_id_idx" ON "transaction_splits" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_splits_category_id_idx" ON "transaction_splits" USING btree ("category_id");