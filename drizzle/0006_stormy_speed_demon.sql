--> DESTRUCTIVE: clears every existing goal contribution and debt payment.
--> Chosen deliberately ("fresh start") because rows written before this
--> migration have no backing transaction, so they skew net worth. Re-enter
--> them through the goal/debt sheets and each one will create its transaction.
DELETE FROM "goal_contributions";--> statement-breakpoint
DELETE FROM "debt_payments";--> statement-breakpoint
ALTER TABLE "debt_payments" ADD COLUMN "transaction_id" text;--> statement-breakpoint
ALTER TABLE "goal_contributions" ADD COLUMN "transaction_id" text;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "debt_payments_transaction_id_idx" ON "debt_payments" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "goal_contributions_transaction_id_idx" ON "goal_contributions" USING btree ("transaction_id");