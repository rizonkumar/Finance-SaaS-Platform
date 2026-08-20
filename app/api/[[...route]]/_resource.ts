import { createId } from "@paralleldrive/cuid2";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware } from "@hono/clerk-auth";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import { type accounts, type categories } from "@/db/schema";
import { API_ERRORS } from "@/lib/messages";

import { requireId } from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

const idParam = z.object({ id: z.string().optional() });
const bulkBody = z.object({ ids: z.array(z.string()) });

type ResourceTable = typeof accounts | typeof categories;

export function createResourceRoutes(table: ResourceTable) {
  const columns = { id: table.id, name: table.name };

  const nameSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
  });

  const requireRow = <T>(row: T | undefined) => {
    if (!row) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }
    return row;
  };

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
      const data = await db
        .delete(table)
        .where(
          and(
            eq(table.userId, c.get("userId")),
            inArray(table.id, c.req.valid("json").ids)
          )
        )
        .returning({ id: table.id });

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
      const id = requireId(c.req.valid("param").id);

      const [row] = await db
        .delete(table)
        .where(and(eq(table.userId, c.get("userId")), eq(table.id, id)))
        .returning({ id: table.id });

      return c.json({ data: requireRow(row) });
    });
}
