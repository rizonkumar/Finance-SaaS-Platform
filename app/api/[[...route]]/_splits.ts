import { createId } from "@paralleldrive/cuid2";
import { eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { db } from "@/db/drizzle";
import { categories, transactionSplits } from "@/db/schema";
import { splitError, type SplitLine } from "@/lib/splits";

import { assertCategoriesOwned } from "./_helpers";

export type TransactionSplit = SplitLine & { category: string | null };

export async function assertValidSplits(
  userId: string,
  amount: number,
  splits: SplitLine[] | undefined
) {
  if (!splits || splits.length === 0) return;

  const error = splitError(amount, splits);

  if (error) throw new HTTPException(400, { message: error });

  await assertCategoriesOwned(
    userId,
    splits.map((split) => split.categoryId)
  );
}

export const splitRows = (transactionId: string, splits: SplitLine[]) =>
  splits.map((split) => ({
    id: createId(),
    transactionId,
    categoryId: split.categoryId,
    amount: split.amount,
  }));

export async function loadSplits(transactionIds: string[]) {
  const grouped = new Map<string, TransactionSplit[]>();

  if (transactionIds.length === 0) return grouped;

  const rows = await db
    .select({
      transactionId: transactionSplits.transactionId,
      categoryId: transactionSplits.categoryId,
      category: categories.name,
      amount: transactionSplits.amount,
    })
    .from(transactionSplits)
    .leftJoin(categories, eq(transactionSplits.categoryId, categories.id))
    .where(inArray(transactionSplits.transactionId, transactionIds));

  for (const { transactionId, ...split } of rows) {
    grouped.set(transactionId, [...(grouped.get(transactionId) ?? []), split]);
  }

  return grouped;
}
