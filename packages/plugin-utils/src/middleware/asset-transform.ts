import { os } from "every-plugin/orpc";

/**
 * Creates a typed oRPC middleware that transforms NEAR Intents routes to provider format.
 * Builds routes by transforming individual source/destination assets.
 */
export function createTransformRoutesMiddleware<TInputAsset, TOutputAsset>(
  transformAsset: (asset: TInputAsset) => Promise<TOutputAsset>
) {
  return os.middleware(async ({ context, next }, input: {
    routes?: Array<{ source: TInputAsset; destination: TInputAsset }>;
  }) => {
    // Transform routes by transforming individual assets
    const transformedRoutes: Array<{ source: TOutputAsset; destination: TOutputAsset }> = [];

    if (input.routes?.length) {
      for (const route of input.routes) {
        const [source, destination] = await Promise.all([
          transformAsset(route.source),
          transformAsset(route.destination)
        ]);
        transformedRoutes.push({ source, destination });
      }
    }

    // Add transformed routes to context (middleware updates context, not input)
    return next({
      context: {
        ...context,
        routes: transformedRoutes
      }
    });
  });
}
