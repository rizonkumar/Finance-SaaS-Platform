import { and, eq, inArray, sum } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { debtPayments } from "@/db/schema";

export async function paidByDebt(userId: string, debtIds: string[]) {
  if (debtIds.length === 0) return new Map<string, number>();

  const rows = await db
    .select({
      debtId: debtPayments.debtId,
      paid: sum(debtPayments.amount),
    })
    .from(debtPayments)
    .where(
      and(
        eq(debtPayments.userId, userId),
        inArray(debtPayments.debtId, debtIds)
      )
    )
    .groupBy(debtPayments.debtId);

  return new Map(rows.map((row) => [row.debtId, Number(row.paid ?? 0)]));
}
