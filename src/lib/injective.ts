/**
 * src/lib/injective.ts
 * SERVER-SIDE ONLY — never import from a client component.
 */

import {
    IndexerGrpcSpotApi,
    IndexerGrpcDerivativesApi,
    getInjectiveAddress,
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
  
  // ─── Market cache — initialized as empty arrays, never null ──────────────────
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await spotApi.fetchMarkets({});
      _spotMarketsCache = response.markets.map((m: any) => ({
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await derivativesApi.fetchMarkets({});
      _derivMarketsCache = response.markets.map((m: any) => ({
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
  
  // ─── Trade fetching ───────────────────────────────────────────────────────────
  const MAX_PAGES = 3;
  const PAGE_SIZE = 100;
  
  export async function fetchSpotTrades(injectiveAddress: string): Promise<RawSpotTrade[]> {
    const allTrades: RawSpotTrade[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const first: any = await (spotApi as any).fetchTrades({
        subaccountId: injectiveAddress,
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
              subaccountId: injectiveAddress,
              pagination: { limit: PAGE_SIZE, skip: PAGE_SIZE * (i + 1) },
            })
          )
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const page of pages) allTrades.push(...((page as any)?.trades ?? []));
      }
    } catch (err) {
      console.error('[Injective] fetchSpotTrades error:', err);
    }
    return allTrades;
  }
  
  export async function fetchDerivativeTrades(injectiveAddress: string): Promise<RawDerivativeTrade[]> {
    const allTrades: RawDerivativeTrade[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const first: any = await (derivativesApi as any).fetchSubaccountTradesList({
        subaccountId: injectiveAddress,
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
              subaccountId: injectiveAddress,
              pagination: { limit: PAGE_SIZE, skip: PAGE_SIZE * (i + 1) },
            })
          )
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const page of pages) allTrades.push(...((page as any)?.trades ?? []));
      }
    } catch (err) {
      console.error('[Injective] fetchDerivativeTrades error:', err);
    }
    return allTrades;
  }