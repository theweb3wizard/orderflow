/**
 * src/lib/injective.ts
 * SERVER-SIDE ONLY — never import from a client component.
 */

import {
  IndexerGrpcSpotApi,
  IndexerGrpcDerivativesApi,
  getInjectiveAddress,
  getEthereumAddress,
} from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';

const endpoints = getNetworkEndpoints(Network.Mainnet);
const spotApi = new IndexerGrpcSpotApi(endpoints.indexer);
const derivativesApi = new IndexerGrpcDerivativesApi(endpoints.indexer);

export interface RawSpotTrade {
  tradeId: string;
  orderHash: string;
  marketId: string;
  subaccountId: string;
  tradeExecutionType: string;
  tradeDirection: string;
  price: { price: string; quantity: string; timestamp: number };
  fee: string;
  feeRecipient: string;
  executedAt: number;
}

export interface RawDerivativeTrade {
  tradeId: string;
  orderHash: string;
  marketId: string;
  subaccountId: string;
  tradeExecutionType: string;
  tradeDirection: string;
  executionPrice: string;
  executionQuantity: string;
  executionMargin: string;
  fee: string;
  executedAt: number;
  pnl: string;
}

export interface MarketMeta {
  marketId: string;
  ticker: string;
  marketType: 'spot' | 'derivative';
  baseDenom: string;
  quoteDenom: string;
}

export function toInjectiveAddress(evmAddress: string): string {
  return getInjectiveAddress(evmAddress);
}

/**
 * Derives the default subaccount ID (index 0) from an inj1... address.
 * Format: 0x{ethereumHex}{23 zeros}0
 * This is what the Injective indexer actually accepts for trade queries.
 */
export function getSubaccountId(injectiveAddress: string): string {
  // Convert inj1... → 0x ethereum address
  const ethereumAddress = getEthereumAddress(injectiveAddress);
  // Strip 0x prefix, pad to 40 chars, add 24 zero chars (index 0)
  const hex = ethereumAddress.toLowerCase().replace('0x', '').padStart(40, '0');
  const suffix = '0'.repeat(23) + '0'; // subaccount index 0
  return '0x' + hex + suffix;
}

// ─── Market cache ─────────────────────────────────────────────────────────────
let _spotMarketsCache: MarketMeta[] = [];
let _derivMarketsCache: MarketMeta[] = [];
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function getSpotMarkets(): Promise<MarketMeta[]> {
  const now = Date.now();
  if (_spotMarketsCache.length > 0 && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _spotMarketsCache;
  }
  try {
    const response: any = await spotApi.fetchMarkets({});
    _spotMarketsCache = (Array.isArray(response) ? response : response.markets ?? []).map((m: any) => ({
      marketId: m.marketId,
      ticker: m.ticker,
      marketType: 'spot' as const,
      baseDenom: m.baseDenom ?? '',
      quoteDenom: m.quoteDenom ?? '',
    }));
    _cacheTimestamp = now;
    return _spotMarketsCache;
  } catch (err) {
    console.error('[Injective] Failed to fetch spot markets:', err);
    return _spotMarketsCache;
  }
}

async function getDerivativeMarkets(): Promise<MarketMeta[]> {
  const now = Date.now();
  if (_derivMarketsCache.length > 0 && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _derivMarketsCache;
  }
  try {
    const response: any = await derivativesApi.fetchMarkets({});
    _derivMarketsCache = (Array.isArray(response) ? response : response.markets ?? []).map((m: any) => ({
      marketId: m.marketId,
      ticker: m.ticker,
      marketType: 'derivative' as const,
      baseDenom: m.oracleBase ?? '',
      quoteDenom: m.quoteDenom ?? '',
    }));
    _cacheTimestamp = now;
    return _derivMarketsCache;
  } catch (err) {
    console.error('[Injective] Failed to fetch derivative markets:', err);
    return _derivMarketsCache;
  }
}

export async function getAllMarkets(): Promise<MarketMeta[]> {
  const [spot, deriv] = await Promise.all([getSpotMarkets(), getDerivativeMarkets()]);
  return [...spot, ...deriv];
}

export function resolveMarketTicker(marketId: string, allMarkets: MarketMeta[]): MarketMeta | null {
  return allMarkets.find((m) => m.marketId === marketId) ?? null;
}

// ─── Trade fetching — uses derived subaccountId, not raw inj1 address ─────────
const MAX_PAGES = 3;
const PAGE_SIZE = 100;

export async function fetchSpotTrades(injectiveAddress: string): Promise<RawSpotTrade[]> {
  const subaccountId = getSubaccountId(injectiveAddress);
  console.log(`[Injective] Fetching spot trades for subaccountId: ${subaccountId}`);
  
  const allTrades: RawSpotTrade[] = [];
  try {
    const first: any = await (spotApi as any).fetchTrades({
      subaccountId,
      pagination: { limit: PAGE_SIZE },
    });
    const firstTrades: RawSpotTrade[] = first?.trades ?? [];
    allTrades.push(...firstTrades);
    
    const total: number = first?.pagination?.total ?? firstTrades.length;
    const remainingPages = Math.min(Math.ceil((total - PAGE_SIZE) / PAGE_SIZE), MAX_PAGES - 1);
    
    if (remainingPages > 0) {
      const pages = await Promise.all(
        Array.from({ length: remainingPages }, (_, i) =>
          (spotApi as any).fetchTrades({
            subaccountId,
            pagination: { limit: PAGE_SIZE, skip: PAGE_SIZE * (i + 1) },
          })
        )
      );
      for (const page of pages) allTrades.push(...((page as any)?.trades ?? []));
    }
    
    console.log(`[Injective] Fetched ${allTrades.length} spot trades`);
  } catch (err) {
    console.error('[Injective] fetchSpotTrades error:', err);
  }
  return allTrades;
}

export async function fetchDerivativeTrades(injectiveAddress: string): Promise<RawDerivativeTrade[]> {
  const subaccountId = getSubaccountId(injectiveAddress);
  console.log(`[Injective] Fetching derivative trades for subaccountId: ${subaccountId}`);
  
  const allTrades: RawDerivativeTrade[] = [];
  try {
    const first: any = await (derivativesApi as any).fetchSubaccountTradesList({
      subaccountId,
      pagination: { limit: PAGE_SIZE },
    });
    const firstTrades: RawDerivativeTrade[] = first?.trades ?? [];
    allTrades.push(...firstTrades);
    
    const total: number = first?.pagination?.total ?? firstTrades.length;
    const remainingPages = Math.min(Math.ceil((total - PAGE_SIZE) / PAGE_SIZE), MAX_PAGES - 1);
    
    if (remainingPages > 0) {
      const pages = await Promise.all(
        Array.from({ length: remainingPages }, (_, i) =>
          (derivativesApi as any).fetchSubaccountTradesList({
            subaccountId,
            pagination: { limit: PAGE_SIZE, skip: PAGE_SIZE * (i + 1) },
          })
        )
      );
      for (const page of pages) allTrades.push(...((page as any)?.trades ?? []));
    }
    
    console.log(`[Injective] Fetched ${allTrades.length} derivative trades`);
  } catch (err) {
    console.error('[Injective] fetchDerivativeTrades error:', err);
  }
  return allTrades;
}