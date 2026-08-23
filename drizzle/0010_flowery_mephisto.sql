ALTER TABLE "goal_contributions" DROP CONSTRAINT "goal_contributions_transaction_id_transactions_id_fk";
--> statement-breakpoint
DROP INDEX "goal_contributions_transaction_id_idx";--> statement-breakpoint
ALTER TABLE "goal_contributions" DROP COLUMN "transaction_id";