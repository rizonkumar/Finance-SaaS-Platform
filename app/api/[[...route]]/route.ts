import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { handle } from "hono/vercel";

import { API_ERRORS } from "@/lib/messages";

import accounts from "./accounts";
import budgets from "./budgets";
import categories from "./categories";
import recurring from "./recurring";
import summary from "./summary";
import transactions from "./transactions";

export const runtime = "nodejs";

const app = new Hono().basePath("/api");

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }

  console.error("[api] unhandled error", error);

  return c.json({ error: API_ERRORS.internal }, 500);
});

const _routes = app
  .route("/summary", summary)
  .route("/accounts", accounts)
  .route("/categories", categories)
  .route("/transactions", transactions)
  .route("/budgets", budgets)
  .route("/recurring", recurring);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof _routes;
