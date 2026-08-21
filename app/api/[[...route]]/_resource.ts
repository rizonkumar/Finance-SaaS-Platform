import { createId } from "@paralleldrive/cuid2";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware } from "@hono/clerk-auth";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/drizzle";
import { type categories } from "@/db/schema";

import {
  bulkBody,
  deleteOwnedRow,
  deleteOwnedRows,
  idParam,
  nameSchema,
  requireId,
  requireRow,
} from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

export function createResourceRoutes(table: typeof categories) {
  const columns = { id: table.id, name: table.name };

  return new Hono<AuthedEnv>()
    .use("*", clerkMiddleware(), requireAuth)
    .get("/", async (c) => {
      const data = await db
        .select(columns)
        .from(table)
        .where(eq(table.userId, c.get("userId")));

      return c.json({ data });
    })
    .get("/:id", zValidator("param", idParam), async (c) => {
      const id = requireId(c.req.valid("param").id);

      const [row] = await db
        .select(columns)
        .from(table)
        .where(and(eq(table.userId, c.get("userId")), eq(table.id, id)));

      return c.json({ data: requireRow(row) });
    })
    .post("/", zValidator("json", nameSchema), async (c) => {
      const [data] = await db
        .insert(table)
        .values({
          id: createId(),
          userId: c.get("userId"),
          ...c.req.valid("json"),
        })
        .returning(columns);

      return c.json({ data });
    })
    .post("/bulk-delete", zValidator("json", bulkBody), async (c) => {
      const data = await deleteOwnedRows(
        table,
        c.get("userId"),
        c.req.valid("json").ids
      );

      return c.json({ data });
    })
    .patch(
      "/:id",
      zValidator("param", idParam),
      zValidator("json", nameSchema),
      async (c) => {
        const id = requireId(c.req.valid("param").id);

        const [row] = await db
          .update(table)
          .set(c.req.valid("json"))
          .where(and(eq(table.userId, c.get("userId")), eq(table.id, id)))
          .returning(columns);

        return c.json({ data: requireRow(row) });
      }
    )
    .delete("/:id", zValidator("param", idParam), async (c) => {
      const [row] = await deleteOwnedRow(
        table,
        c.get("userId"),
        requireId(c.req.valid("param").id)
      );

      return c.json({ data: requireRow(row) });
    });
}
