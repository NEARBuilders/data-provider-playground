'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { orpc as prodOrpc } from '@/utils/orpc';
import { DevConfigManager, type CustomRpcConfig } from '@/lib/dev-config';

type ORPCClient = typeof prodOrpc;

interface ClientContextValue {
  client: ORPCClient;
  customRpcConfig: CustomRpcConfig | null;
}

const ClientContext = createContext<ClientContextValue | null>(null);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [customRpcConfig, setCustomRpcConfig] = useState<CustomRpcConfig | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const config = DevConfigManager.getConfig();
    setCustomRpcConfig(config);

    const handleConfigChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setCustomRpcConfig(customEvent.detail);
    };

    window.addEventListener('rpc-config-changed', handleConfigChange);
    return () => window.removeEventListener('rpc-config-changed', handleConfigChange);
  }, []);

  return (
    <ClientContext.Provider value={{ client: prodOrpc, customRpcConfig }}>
      {customRpcConfig?.enabled && (
        <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm">
          🔗 Custom RPC: {customRpcConfig.url}/api/rpc
        </div>
      )}
      {children}
    </ClientContext.Provider>
  );
}

export function useORPC() {
  const context = useContext(ClientContext);
  if (!context) throw new Error('useORPC must be used within ClientProvider');
  return context.client;
}

export function useCustomRpc() {
  const context = useContext(ClientContext);
  if (!context) throw new Error('useCustomRpc must be used within ClientProvider');
  return context.customRpcConfig;
}
