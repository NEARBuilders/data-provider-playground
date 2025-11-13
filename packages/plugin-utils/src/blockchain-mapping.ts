interface ChainData {
  name: string;
  chain: string;
  chainId: number;
  networkId: number;
  shortName: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

let chainCache: ChainData[] | null = null;

async function loadChains(): Promise<ChainData[]> {
  if (chainCache) return chainCache;

  const response = await fetch('https://chainid.network/chains.json');
  if (!response.ok) {
    throw new Error(`Chainlist API failed: ${response.status}`);
  }

  chainCache = await response.json() as ChainData[];
  return chainCache;
}

function normalizeBlockchainName(blockchain: string): string {
  const normalized = blockchain.toLowerCase().trim();

  // Handle Arbitrum variations: arb, arb-one, arbitrum → arb1
  if (normalized.startsWith('arb') || normalized === 'arbitrum') {
    return 'arb1';
  }

  // Future: Add more normalizations as needed
  // e.g., eth-mainnet → eth, optimism → oeth, etc.

  return normalized;
}

export async function getChainByName(blockchain: string): Promise<ChainData | null> {
  const chains = await loadChains();

  const normalized = normalizeBlockchainName(blockchain);
  return chains.find(c =>
    c.shortName?.toLowerCase() === normalized
  ) ?? null;
}

export async function getChainId(blockchain: string): Promise<number | null> {
  const chain = await getChainByName(blockchain);
  return chain?.chainId ?? null;
}

export async function getBlockchainFromChainId(chainId: string): Promise<string | null> {
  const chains = await loadChains();

  const numericChainId = parseInt(chainId, 10);
  const chain = chains.find(c => c.chainId === numericChainId);

  switch(chain?.shortName) {
    case "arb1": {
      return "arb";
    }
    default: {
      return chain?.shortName ?? null;
    }
  }
}
