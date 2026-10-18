import { eq } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { categoryRules } from "@/db/schema";
import { applyCategoryRules } from "@/lib/category-rules";

export function loadRules(userId: string) {
  return db
    .select({
      pattern: categoryRules.pattern,
      match: categoryRules.match,
      categoryId: categoryRules.categoryId,
      priority: categoryRules.priority,
    })
    .from(categoryRules)
    .where(eq(categoryRules.userId, userId));
}

export async function categorizeRows<
  T extends { payee: string; categoryId?: string | null },
>(userId: string, rows: T[]) {
  return applyCategoryRules(rows, await loadRules(userId));
}
