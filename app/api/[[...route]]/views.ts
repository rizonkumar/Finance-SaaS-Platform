import { clerkMiddleware } from "@clerk/hono";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import { insertSavedViewSchema, savedViews } from "@/db/schema";
import { isViewableRoute } from "@/lib/routes";
import { MAX_SAVED_VIEWS, sanitizeViewQuery } from "@/lib/saved-views";

import { deleteOwnedRow, idParam, requireId, requireRow } from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

const createBody = insertSavedViewSchema
  .pick({ name: true, emoji: true, isPinned: true })
  .extend({
    route: z.string().refine(isViewableRoute, "That page cannot be saved"),
    query: z.string().max(500).transform(sanitizeViewQuery),
  });

const updateBody = insertSavedViewSchema
  .pick({ name: true, emoji: true, isPinned: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

const viewColumns = {
  id: savedViews.id,
  name: savedViews.name,
  emoji: savedViews.emoji,
  route: savedViews.route,
  query: savedViews.query,
  isPinned: savedViews.isPinned,
  lastOpenedAt: savedViews.lastOpenedAt,
  createdAt: savedViews.createdAt,
};

const ownedView = (userId: string, id: string) =>
  and(eq(savedViews.userId, userId), eq(savedViews.id, id));

async function assertRoomForView(userId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(savedViews)
    .where(eq(savedViews.userId, userId));

  if ((row?.total ?? 0) >= MAX_SAVED_VIEWS) {
    throw new HTTPException(400, {
      message: `You can keep up to ${MAX_SAVED_VIEWS} saved views`,
    });
  }
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const data = await db
      .select(viewColumns)
      .from(savedViews)
      .where(eq(savedViews.userId, c.get("userId")))
      .orderBy(asc(savedViews.sortOrder), desc(savedViews.createdAt));

    return c.json({ data });
  })
  .post("/", zValidator("json", createBody), async (c) => {
    const userId = c.get("userId");

    await assertRoomForView(userId);

    const [data] = await db
      .insert(savedViews)
      .values({ id: createId(), userId, ...c.req.valid("json") })
      .returning(viewColumns);

    return c.json({ data });
  })
  .post("/:id/open", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);

    const [row] = await db
      .update(savedViews)
      .set({ lastOpenedAt: new Date() })
      .where(ownedView(c.get("userId"), id))
      .returning(viewColumns);

    return c.json({ data: requireRow(row) });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", updateBody),
    async (c) => {
      const id = requireId(c.req.valid("param").id);

      const [row] = await db
        .update(savedViews)
        .set(c.req.valid("json"))
        .where(ownedView(c.get("userId"), id))
        .returning(viewColumns);

      return c.json({ data: requireRow(row) });
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const [row] = await deleteOwnedRow(
      savedViews,
      c.get("userId"),
      requireId(c.req.valid("param").id)
    );

    return c.json({ data: requireRow(row) });
  });

export default app;
