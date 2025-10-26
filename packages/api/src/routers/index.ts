import { publicProcedure } from "../index";
import { dataProviderRouter } from "../runtime";
import type { RouterClient } from "@orpc/server";

export const appRouter = publicProcedure.router({
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	dataProvider: {
		getSnapshot: dataProviderRouter.getSnapshot,
		ping: dataProviderRouter.ping,
	},
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
