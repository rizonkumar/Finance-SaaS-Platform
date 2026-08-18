import { categories } from "@/db/schema";

import { createResourceRoutes } from "./_resource";

const app = createResourceRoutes(categories);

export default app;
