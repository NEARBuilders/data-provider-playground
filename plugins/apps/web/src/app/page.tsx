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
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Zap } from "lucide-react";

export default function Home() {
  const queryClient = useQueryClient();

  // Form state for routes and notionals
  const [routes, setRoutes] = useState([
    { source: { chainId: "1", assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6 },
      destination: { chainId: "137", assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", decimals: 6 } }
  ]);
  const [notionals, setNotionals] = useState(["1000000", "10000000"]);
  const [includeWindows, setIncludeWindows] = useState(["24h"]);

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

  const formatLatency = (seconds: number | undefined) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs.toFixed(0)}s`;
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">cBridge Data Provider</h1>
          <p className="text-muted-foreground mt-2">
            Real-time cross-chain bridge metrics from cBridge (Celer Network)
          </p>
        </div>

        {/* API Status */}
        <Card>
          <CardHeader>
            <CardTitle>API Status</CardTitle>
            <CardDescription>
              Connection status for the cBridge data provider plugin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  pluginPing.data?.status === "ok"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                cBridge Data Provider:{" "}
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
                  Chain {routes[0].source.chainId}: {routes[0].source.symbol}
                </div>
              </div>
              <div>
                <Label>Destination Asset</Label>
                <div className="text-sm text-muted-foreground">
                  Chain {routes[0].destination.chainId}: {routes[0].destination.symbol}
                </div>
              </div>
            </div>

            <div>
              <Label>Notional Amounts (in token base units)</Label>
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
                    placeholder="1000000"
                    className="w-32"
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Amounts in smallest token units (e.g., 1000000 = 1 USDC for 6 decimals)
              </p>
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
              <Zap className="w-4 h-4 mr-2" />
              Fetch Real-Time Data
            </Button>
          </CardContent>
        </Card>

        {/* Rate Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Quotes & Transfer Details</CardTitle>
            <CardDescription>
              Real-time exchange rates, fees, and transfer estimates from cBridge API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshotQuery.isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {snapshotQuery.data?.rates && snapshotQuery.data.rates.length > 0 ? (
              <div className="space-y-4">
                {snapshotQuery.data.rates.map((rate: any, index: number) => (
                  <div key={index} className="p-4 border-2 rounded-lg hover:border-primary/50 transition-colors">
                    {/* Route Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold text-lg">
                          {rate.source.symbol} → {rate.destination.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Chain {rate.source.chainId} → Chain {rate.destination.chainId}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {rate.estimatedLatencySeconds && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLatency(rate.estimatedLatencySeconds)}
                          </Badge>
                        )}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {rate.effectiveRate.toFixed(6)}
                        </Badge>
                      </div>
                    </div>

                    {/* Main Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-xs text-muted-foreground block mb-1">Amount In</span>
                        <div className="font-mono font-bold">
                          {(Number(rate.amountIn) / Math.pow(10, rate.source.decimals)).toFixed(2)} {rate.source.symbol}
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-xs text-muted-foreground block mb-1">Amount Out</span>
                        <div className="font-mono font-bold text-green-600">
                          {(Number(rate.amountOut) / Math.pow(10, rate.destination.decimals)).toFixed(2)} {rate.destination.symbol}
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-xs text-muted-foreground block mb-1">Bridge Rate</span>
                        <div className="font-mono font-bold">
                          {rate.bridgeRate ? rate.bridgeRate.toFixed(6) : 'N/A'}
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-xs text-muted-foreground block mb-1">Total Fees</span>
                        <div className="font-mono font-bold text-red-600">
                          ${rate.totalFeesUsd?.toFixed(4) || '0.0000'}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t">
                      <div>
                        <span className="text-xs text-muted-foreground">Effective Rate:</span>
                        <div className="text-sm font-mono">{rate.effectiveRate.toFixed(8)}</div>
                      </div>
                      {rate.maxSlippage !== undefined && (
                        <div>
                          <span className="text-xs text-muted-foreground">Max Slippage:</span>
                          <div className="text-sm font-mono">{(rate.maxSlippage / 10000).toFixed(2)}%</div>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-muted-foreground">Quoted At:</span>
                        <div className="text-sm font-mono">
                          {new Date(rate.quotedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !snapshotQuery.isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No rate quotes available. Click "Fetch Real-Time Data" to get quotes.</p>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Liquidity Depth */}
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Depth Analysis</CardTitle>
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

            {snapshotQuery.data?.liquidity && snapshotQuery.data.liquidity.length > 0 ? (
              <div className="space-y-3">
                {snapshotQuery.data.liquidity.map((liquidity, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {liquidity.route.source.symbol} → {liquidity.route.destination.symbol}
                    </div>

                    <div className="space-y-2">
                      {liquidity.thresholds.map((threshold, thresholdIndex) => (
                        <div key={thresholdIndex} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <span className="text-sm">
                              At {threshold.slippageBps}bps ({(threshold.slippageBps / 100).toFixed(2)}%) slippage
                            </span>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            {(Number(threshold.maxAmountIn) / Math.pow(10, liquidity.route.source.decimals)).toFixed(2)} {liquidity.route.source.symbol}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !snapshotQuery.isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No liquidity data available. Configure routes and fetch snapshot.</p>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Volume Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Metrics</CardTitle>
            <CardDescription>
              Trading volume from official cBridge statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshotQuery.isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {snapshotQuery.data?.volumes && snapshotQuery.data.volumes.length > 0 ? (
              <div className="space-y-2">
                {snapshotQuery.data.volumes.map((volume, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{volume.window}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        window
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-base font-mono">
                      ${volume.volumeUsd.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              !snapshotQuery.isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Click "Fetch Real-Time Data" to load volume metrics</p>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Listed Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Assets ({snapshotQuery.data?.listedAssets?.assets.length || 0})</CardTitle>
            <CardDescription>
              Assets available for bridging on cBridge
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {snapshotQuery.data.listedAssets.assets.slice(0, 50).map((asset, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="font-semibold text-lg">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        Chain: {asset.chainId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Decimals: {asset.decimals}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1 truncate">
                        {asset.assetId}
                      </div>
                    </div>
                  ))}
                </div>

                {snapshotQuery.data.listedAssets.assets.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                    ...and {snapshotQuery.data.listedAssets.assets.length - 50} more assets
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {snapshotQuery.error && (
          <Card className="border-red-500">
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
