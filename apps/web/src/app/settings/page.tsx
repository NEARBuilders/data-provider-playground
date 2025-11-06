'use client';

import { useState, useEffect } from 'react';
import { DevConfigManager, type CustomRpcConfig } from '@/lib/dev-config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { queryClient } from '@/utils/orpc';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [rpcUrl, setRpcUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    const config = DevConfigManager.getConfig();
    if (config) {
      setRpcUrl(config.url);
      setEnabled(config.enabled);
    }
    updateCurrentUrl();
  }, []);

  function updateCurrentUrl() {
    const config = DevConfigManager.getConfig();
    if (config?.enabled && config?.url) {
      setCurrentUrl(`${config.url}/api/rpc`);
    } else {
      setCurrentUrl(`${window.location.origin}/api/rpc`);
    }
  }

  function handleSave() {
    if (!rpcUrl.trim()) {
      toast.error('Please enter a valid RPC URL');
      return;
    }

    const config: CustomRpcConfig = {
      url: rpcUrl.trim(),
      enabled: enabled
    };

    DevConfigManager.saveConfig(config);
    updateCurrentUrl();
    
    queryClient.invalidateQueries();
    
    toast.success(
      enabled 
        ? `Custom RPC URL activated: ${rpcUrl}/api/rpc` 
        : 'Custom RPC URL saved (disabled)'
    );
  }

  function handleClear() {
    DevConfigManager.clearConfig();
    setRpcUrl('');
    setEnabled(false);
    updateCurrentUrl();
    queryClient.invalidateQueries();
    toast.success('Custom RPC URL cleared');
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold mb-6">RPC Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Custom RPC URL</CardTitle>
          <CardDescription>
            Configure a custom RPC endpoint for testing local plugins or tunnels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rpc-url">Base URL</Label>
            <Input
              id="rpc-url"
              type="url"
              placeholder="http://localhost:3014 or https://your-tunnel.com"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The full RPC path will be: <span className="font-mono">{rpcUrl || '(your-url)'}/api/rpc</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              Enable custom RPC URL
            </Label>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Current Active URL:</p>
            <p className="text-sm font-mono text-muted-foreground break-all">{currentUrl}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear & Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
