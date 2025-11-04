import { publicProcedure } from "../index";
import { plugins } from "../plugins";
import type { RouterClient } from "@orpc/server";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	dataProvider: publicProcedure.router(plugins.template.router)
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
