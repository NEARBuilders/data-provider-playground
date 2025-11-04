"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const queryClient = useQueryClient();

  // Form state for routes and notionals
  const [routes, setRoutes] = useState([
    { source: { chainId: "1", assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6 },
      destination: { chainId: "137", assetId: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", symbol: "USDC", decimals: 6 } }
  ]);
  const [notionals, setNotionals] = useState(["1000", "10000"]);
  const [includeWindows, setIncludeWindows] = useState(["24h"]);

  // Health check
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());

  // Plugin ping
  const pluginPing = useQuery(orpc.dataProvider.ping.queryOptions());

  // Snapshot query
  const snapshotQuery = useQuery({
    ...orpc.dataProvider.getSnapshot.queryOptions({
      input: {
        routes,
        notionals,
        includeWindows: includeWindows as Array<"24h" | "7d" | "30d">,
      },
    }),
    enabled: routes.length > 0 && notionals.length > 0,
  });

  const handleFetchSnapshot = () => {
    queryClient.invalidateQueries({
      queryKey: orpc.dataProvider.getSnapshot.queryKey({
        input: {
          routes,
          notionals,
          includeWindows: includeWindows as Array<"24h" | "7d" | "30d">,
        },
      }),
    });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Data Provider Template</h1>
          <p className="text-muted-foreground mt-2">
            Template for building single-provider bridge data adapters
          </p>
        </div>

        {/* API Status */}
        <Card>
          <CardHeader>
            <CardTitle>API Status</CardTitle>
            <CardDescription>
              Connection status for both the main API and data provider plugin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  healthCheck.data ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                Main API:{" "}
                {healthCheck.isLoading
                  ? "Checking..."
                  : healthCheck.data
                  ? "Connected"
                  : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  pluginPing.data?.status === "ok"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                Data Provider Plugin:{" "}
                {pluginPing.isLoading
                  ? "Checking..."
                  : pluginPing.data?.status === "ok"
                  ? "Connected"
                  : "Disconnected"}
              </span>
            </div>
            {pluginPing.data?.timestamp && (
              <p className="text-xs text-muted-foreground">
                Last ping:{" "}
                {new Date(pluginPing.data.timestamp).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Route Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Route Configuration</CardTitle>
            <CardDescription>
              Configure source/destination asset pairs and notional amounts to quote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Source Asset</Label>
                <div className="text-sm text-muted-foreground">
                  ETH USDC → POL USDC (example)
                </div>
              </div>
              <div>
                <Label>Destination Asset</Label>
                <div className="text-sm text-muted-foreground">
                  POL USDC (example)
                </div>
              </div>
            </div>

            <div>
              <Label>Notional Amounts (USD)</Label>
              <div className="flex gap-2 mt-1">
                {notionals.map((notional, index) => (
                  <Input
                    key={index}
                    value={notional}
                    onChange={(e) => {
                      const newNotionals = [...notionals];
                      newNotionals[index] = e.target.value;
                      setNotionals(newNotionals);
                    }}
                    placeholder="1000"
                    className="w-24"
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Time Windows</Label>
              <div className="flex gap-2 mt-1">
                {["24h", "7d", "30d"].map((window) => (
                  <Button
                    key={window}
                    variant={includeWindows.includes(window) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (includeWindows.includes(window)) {
                        setIncludeWindows(includeWindows.filter(w => w !== window));
                      } else {
                        setIncludeWindows([...includeWindows, window]);
                      }
                    }}
                  >
                    {window}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleFetchSnapshot} disabled={routes.length === 0 || notionals.length === 0}>
              Fetch Snapshot
            </Button>
          </CardContent>
        </Card>

        {/* Volume Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Metrics</CardTitle>
            <CardDescription>
              Trading volume for selected time windows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshotQuery.isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            )}

            {snapshotQuery.data?.volumes && (
              <div className="space-y-2">
                {snapshotQuery.data.volumes.map((volume, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{volume.window}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        window
                      </span>
                    </div>
                    <Badge variant="secondary">
                      ${volume.volumeUsd.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Quotes</CardTitle>
            <CardDescription>
              Exchange rates and fees for each route/notional combination
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshotQuery.isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {snapshotQuery.data?.rates && (
              <div className="space-y-3">
                {snapshotQuery.data.rates.map((rate, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">
                          {rate.source.symbol} → {rate.destination.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rate.source.chainId} → {rate.destination.chainId}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {rate.effectiveRate.toFixed(4)} rate
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Amount In:</span>
                        <div className="font-mono">{rate.amountIn}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount Out:</span>
                        <div className="font-mono">{rate.amountOut}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fees:</span>
                        <div className="font-mono">${rate.totalFeesUsd?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quoted:</span>
                        <div className="font-mono text-xs">
                          {new Date(rate.quotedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liquidity Depth */}
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Depth</CardTitle>
            <CardDescription>
              Maximum input amounts at different slippage thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshotQuery.isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {snapshotQuery.data?.liquidity && (
              <div className="space-y-3">
                {snapshotQuery.data.liquidity.map((liquidity, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="font-medium mb-3">
                      {liquidity.route.source.symbol} → {liquidity.route.destination.symbol}
                    </div>

                    <div className="space-y-2">
                      {liquidity.thresholds.map((threshold, thresholdIndex) => (
                        <div key={thresholdIndex} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-muted-foreground">
                              Max input at {threshold.slippageBps}bps slippage:
                            </span>
                          </div>
                          <Badge variant="secondary">
                            ${threshold.maxAmountIn}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listed Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Assets</CardTitle>
            <CardDescription>
              Assets available on this provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshotQuery.isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            )}

            {snapshotQuery.data?.listedAssets && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {snapshotQuery.data.listedAssets.assets.map((asset, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      Chain: {asset.chainId}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Decimals: {asset.decimals}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {asset.assetId.slice(0, 10)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {snapshotQuery.error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Error: {snapshotQuery.error.message}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
