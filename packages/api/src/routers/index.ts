import { publicProcedure } from "../index";
import { dataProviderRouter } from "../runtime";
import type { Router, RouterClient } from "@orpc/server";

// ✅ Explicitly declare router type to avoid inference errors from Zod
export const appRouter: Router<any, any> = publicProcedure.router({
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  dataProvider: dataProviderRouter,
});

// ✅ Explicitly type exports to keep TS portable for d.ts builds
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
