import { getAuth } from "@hono/clerk-auth";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { API_ERRORS } from "@/lib/messages";

export type AuthedEnv = {
  Variables: {
    userId: string;
  };
};

export const requireAuth = createMiddleware<AuthedEnv>(async (c, next) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    throw new HTTPException(401, { message: API_ERRORS.unauthorized });
  }

  c.set("userId", auth.userId);

  await next();
});
