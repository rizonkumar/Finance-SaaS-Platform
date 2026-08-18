import { accounts } from "@/db/schema";

import { createResourceRoutes } from "./_resource";

const app = createResourceRoutes(accounts);

export default app;
