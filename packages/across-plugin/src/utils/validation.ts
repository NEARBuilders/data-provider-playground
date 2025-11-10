/**
 * Input validation and sanitization utilities
 */

import { ValidationError } from './errors';

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate chain ID
 */
export function isValidChainId(chainId: string | number): boolean {
  const id = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return !isNaN(id) && id > 0 && id < 1000000;
}

/**
 * Validate amount string (must be positive integer)
 */
export function isValidAmount(amount: string): boolean {
  return /^\d+$/.test(amount) && BigInt(amount) > 0n;
}

/**
 * Validate and sanitize asset
 */
export function validateAsset(asset: unknown): void {
  if (!asset || typeof asset !== 'object') {
    throw new ValidationError('Asset must be an object');
  }

  const a = asset as Record<string, unknown>;

  if (!a.chainId || !isValidChainId(String(a.chainId))) {
    throw new ValidationError('Invalid chainId', 'chainId');
  }

  if (!a.assetId || typeof a.assetId !== 'string' || !isValidAddress(a.assetId)) {
    throw new ValidationError('Invalid assetId', 'assetId');
  }

  if (!a.symbol || typeof a.symbol !== 'string' || a.symbol.length === 0) {
    throw new ValidationError('Invalid symbol', 'symbol');
  }

  if (typeof a.decimals !== 'number' || a.decimals < 0 || a.decimals > 18) {
    throw new ValidationError('Invalid decimals (must be 0-18)', 'decimals');
  }
}

/**
 * Validate route
 */
export function validateRoute(route: unknown): void {
  if (!route || typeof route !== 'object') {
    throw new ValidationError('Route must be an object');
  }

  const r = route as Record<string, unknown>;

  if (!r.source) {
    throw new ValidationError('Route must have source asset', 'source');
  }
  validateAsset(r.source);

  if (!r.destination) {
    throw new ValidationError('Route must have destination asset', 'destination');
  }
  validateAsset(r.destination);
}

/**
 * Validate notional amount
 */
export function validateNotional(notional: unknown): void {
  if (typeof notional !== 'string') {
    throw new ValidationError('Notional must be a string', 'notional');
  }

  if (!isValidAmount(notional)) {
    throw new ValidationError('Notional must be a positive integer string', 'notional');
  }
}

/**
 * Sanitize string to prevent injection
 */
export function sanitizeString(input: string, maxLength: number = 256): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML/script tags
}

/**
 * Validate time window
 */
export function isValidTimeWindow(window: string): window is '24h' | '7d' | '30d' {
  return ['24h', '7d', '30d'].includes(window);
}

/**
 * Validate snapshot request parameters
 */
export function validateSnapshotParams(params: {
  routes: unknown[];
  notionals: unknown[];
  includeWindows?: unknown[];
}): void {
  if (!Array.isArray(params.routes) || params.routes.length === 0) {
    throw new ValidationError('Routes must be a non-empty array', 'routes');
  }

  if (!Array.isArray(params.notionals) || params.notionals.length === 0) {
    throw new ValidationError('Notionals must be a non-empty array', 'notionals');
  }

  // Validate each route
  params.routes.forEach((route, index) => {
    try {
      validateRoute(route);
    } catch (error) {
      throw new ValidationError(
        `Invalid route at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `routes[${index}]`
      );
    }
  });

  // Validate each notional
  params.notionals.forEach((notional, index) => {
    try {
      validateNotional(notional);
    } catch (error) {
      throw new ValidationError(
        `Invalid notional at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `notionals[${index}]`
      );
    }
  });

  // Validate time windows if provided
  if (params.includeWindows) {
    if (!Array.isArray(params.includeWindows)) {
      throw new ValidationError('includeWindows must be an array', 'includeWindows');
    }

    params.includeWindows.forEach((window, index) => {
      if (!isValidTimeWindow(String(window))) {
        throw new ValidationError(
          `Invalid time window at index ${index}: must be one of 24h, 7d, 30d`,
          `includeWindows[${index}]`
        );
      }
    });
  }
}

