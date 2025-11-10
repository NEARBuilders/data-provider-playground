import { SERVER_URL } from "@/utils/orpc";

// Extract base URL without /api/rpc suffix for API docs
const API_DOCS_URL = SERVER_URL.replace('/api/rpc', '/api');

export default function Home() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-12">
      <div className="space-y-8">
        <div className="p-6 bg-card hover:shadow-lg transition-all active:scale-[0.98]">
          <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
          <p className="text-muted-foreground mb-4">
            Use the oRPC client to query the connected server and build your own
            data dashboard.
          </p>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
            <code>{`import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

// Query the data provider
const { data } = useQuery(
  orpc.dataProvider.getSnapshot.queryOptions({
    input: { routes, notionals, includeWindows }
  })
);`}</code>
          </pre>
        </div>

        <div className="p-6 bg-card hover:shadow-lg transition-all active:scale-[0.98]">
          <h2 className="text-2xl font-semibold mb-4">Available Data</h2>
          <p className="text-muted-foreground mb-3">
            The snapshot returns comprehensive provider data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>volumes</strong> - Trading volume metrics for 24h, 7d, and
              30d windows
            </li>
            <li>
              <strong>rates</strong> - Exchange rates, fees, and quotes for
              specified routes
            </li>
            <li>
              <strong>liquidity</strong> - Liquidity depth at different slippage
              thresholds
            </li>
            <li>
              <strong>listedAssets</strong> - Available assets on the provider
            </li>
          </ul>
        </div>

        <div className="p-6 bg-card hover:shadow-lg transition-all active:scale-[0.98]">
          <h2 className="text-2xl font-semibold mb-4">Resources</h2>
          <ul className="space-y-3">
            <li>
              <a
                href={API_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-lg"
              >
                API Documentation →
              </a>
            </li>
            <li>
              <a
                href="https://orpc.unnoq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-lg"
              >
                oRPC Docs →
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
