import { clerkMiddleware } from "@clerk/hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/drizzle";
import {
  accounts,
  budgets,
  categories,
  categoryRules,
  debts,
  goals,
  insertUserSettingsSchema,
  savedViews,
  userSettings,
} from "@/db/schema";

import { loadSettings } from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

const settingsBody = insertUserSettingsSchema.pick({
  currency: true,
  weekStartsOn: true,
});

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const data = await loadSettings(c.get("userId"));

    return c.json({ data });
  })
  .patch("/", zValidator("json", settingsBody), async (c) => {
    const userId = c.get("userId");
    const values = { ...c.req.valid("json"), updatedAt: new Date() };

    const [data] = await db
      .insert(userSettings)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: userSettings.userId, set: values })
      .returning({
        currency: userSettings.currency,
        weekStartsOn: userSettings.weekStartsOn,
      });

    return c.json({ data });
  })
  .delete("/data", async (c) => {
    const userId = c.get("userId");

    await db.batch([
      db.delete(savedViews).where(eq(savedViews.userId, userId)),
      db.delete(categoryRules).where(eq(categoryRules.userId, userId)),
      db.delete(budgets).where(eq(budgets.userId, userId)),
      db.delete(goals).where(eq(goals.userId, userId)),
      db.delete(debts).where(eq(debts.userId, userId)),
      db.delete(accounts).where(eq(accounts.userId, userId)),
      db.delete(categories).where(eq(categories.userId, userId)),
      db.delete(userSettings).where(eq(userSettings.userId, userId)),
    ]);

    return c.json({ data: { deleted: true } });
  });

export default app;
