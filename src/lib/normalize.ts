/**
 * src/lib/normalize.ts
 *
 * Converts raw Injective API trade objects (spot + derivative) into
 * the unified Trade interface used by the rest of the app.
 *
 * This is the translation layer between Injective's data shape and ours.
 * If Injective's API changes, this is the only file that needs updating.
 */

import { Trade } from './mock-data';
import { RawSpotTrade, RawDerivativeTrade, MarketMeta, resolveMarketTicker } from './injective';

// ─── Constants ────────────────────────────────────────────────────────────────

// Injective stores prices and quantities with 18 decimal places (or market-specific)
// We use a simplified conversion: divide by 1e18 for INJ-denominated, 1e6 for USDT
// In practice the SDK returns human-readable strings for price/quantity in fetchTrades.
// We trust those values directly and only apply USDT conversion where needed.

// ─── Spot Trade Normalization ─────────────────────────────────────────────────

/**
 * Normalizes a single raw spot trade into our Trade interface.
 *
 * Spot trades don't have realized P&L in the API (P&L requires matching
 * buy/sell pairs via FIFO — we skip that for MVP and show null for spot P&L).
 * Derivative trades include explicit P&L from the API.
 */
export function normalizeSpotTrade(
  raw: RawSpotTrade,
  allMarkets: MarketMeta[]
): Trade | null {
  try {
    const market = resolveMarketTicker(raw.marketId, allMarkets);
    if (!market) {
      // Unknown market — skip this trade rather than showing garbage
      return null;
    }

    // tradeExecutionType maps to our orderType
    // 'market' → MARKET
    // 'limitFill' | 'limitMatchRestingOrder' | 'limitMatchNewOrder' → LIMIT
    const orderType: 'MARKET' | 'LIMIT' =
      raw.tradeExecutionType === 'market' ? 'MARKET' : 'LIMIT';

    const type: 'BUY' | 'SELL' =
      raw.tradeDirection === 'buy' ? 'BUY' : 'SELL';

    // price.price and price.quantity are human-readable decimal strings from the SDK
    const price = parseFloat(raw.price.price);
    const quantity = parseFloat(raw.price.quantity);

    // Size in USDT = price × quantity
    const size = Math.round(price * quantity * 100) / 100;

    // Spot trades: no P&L from API
    // Post-hackathon: implement FIFO matching here
    const pnl: number | null = null;

    // executedAt is unix milliseconds
    const timestamp = new Date(raw.executedAt).toISOString();

    // txHash comes from orderHash on spot trades
    const txHash = raw.orderHash ?? raw.tradeId ?? '0x';

    return {
      id: raw.tradeId,
      market: market.ticker,
      type,
      orderType,
      status: 'CLOSED',
      size,
      price,
      exitPrice: null,  // Spot trades don't have a discrete exit price in this model
      pnl,
      timestamp,
      txHash,
    };
  } catch (err) {
    console.error('[normalize] Failed to normalize spot trade:', raw.tradeId, err);
    return null;
  }
}

// ─── Derivative Trade Normalization ──────────────────────────────────────────

/**
 * Normalizes a single raw derivative trade into our Trade interface.
 *
 * Derivative trades have explicit realized P&L from the Injective API.
 * This is the most valuable data for the AI analysis.
 */
export function normalizeDerivativeTrade(
  raw: RawDerivativeTrade,
  allMarkets: MarketMeta[]
): Trade | null {
  try {
    const market = resolveMarketTicker(raw.marketId, allMarkets);
    if (!market) return null;

    const orderType: 'MARKET' | 'LIMIT' =
      raw.tradeExecutionType === 'market' ? 'MARKET' : 'LIMIT';

    const type: 'BUY' | 'SELL' =
      raw.tradeDirection === 'buy' ? 'BUY' : 'SELL';

    const price = parseFloat(raw.executionPrice);
    const quantity = parseFloat(raw.executionQuantity);
    const size = Math.round(price * quantity * 100) / 100;

    // Derivative P&L is explicit — this is the key data point for analysis
    const pnlRaw = parseFloat(raw.pnl ?? '0');
    const pnl = isNaN(pnlRaw) ? null : Math.round(pnlRaw * 100) / 100;

    const timestamp = new Date(raw.executedAt).toISOString();
    const txHash = raw.orderHash ?? raw.tradeId ?? '0x';

    return {
      id: raw.tradeId,
      market: market.ticker,
      type,
      orderType,
      status: 'CLOSED',
      size,
      price,
      exitPrice: null,
      pnl,
      timestamp,
      txHash,
    };
  } catch (err) {
    console.error('[normalize] Failed to normalize derivative trade:', raw.tradeId, err);
    return null;
  }
}

// ─── Batch Normalization ──────────────────────────────────────────────────────

/**
 * Normalizes and merges spot + derivative trades into a single sorted array.
 * Filters out null results (unknown markets, parse errors).
 * Sorts by timestamp descending (most recent first).
 */
export function normalizeAllTrades(
  spotTrades: RawSpotTrade[],
  derivTrades: RawDerivativeTrade[],
  allMarkets: MarketMeta[]
): Trade[] {
  const normalized: Trade[] = [];

  for (const raw of spotTrades) {
    const trade = normalizeSpotTrade(raw, allMarkets);
    if (trade) normalized.push(trade);
  }

  for (const raw of derivTrades) {
    const trade = normalizeDerivativeTrade(raw, allMarkets);
    if (trade) normalized.push(trade);
  }

  // Sort most recent first
  normalized.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return normalized;
}

// ─── Stats Computation ────────────────────────────────────────────────────────

/**
 * Computes the summary statistics shown in the StatsStrip component.
 * Works identically for both mock and real trade data.
 */
export interface TradeStats {
  totalTrades: number;
  winRate: number;         // percentage, 0–100
  totalVolume: number;     // USDT
  marketsTraded: number;
  dateRangeLabel: string;  // e.g. "90 days"
  daysCovered: number;
}

export function computeStats(trades: Trade[]): TradeStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      totalVolume: 0,
      marketsTraded: 0,
      dateRangeLabel: '—',
      daysCovered: 0,
    };
  }

  const tradesWithPnl = trades.filter((t) => t.pnl !== null);
  const winners = tradesWithPnl.filter((t) => t.pnl! > 0);
  const winRate =
    tradesWithPnl.length > 0
      ? Math.round((winners.length / tradesWithPnl.length) * 1000) / 10
      : 0;

  const totalVolume = Math.round(
    trades.reduce((sum, t) => sum + (t.size ?? 0), 0)
  );

  const uniqueMarkets = new Set(trades.map((t) => t.market));

  const timestamps = trades.map((t) => new Date(t.timestamp).getTime());
  const earliest = new Date(Math.min(...timestamps));
  const latest = new Date(Math.max(...timestamps));
  const daysCovered = Math.max(
    1,
    Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    totalTrades: trades.length,
    winRate,
    totalVolume,
    marketsTraded: uniqueMarkets.size,
    dateRangeLabel: `${daysCovered} days`,
    daysCovered,
  };
}

// ─── Behavioral Pre-Analysis ──────────────────────────────────────────────────

/**
 * Computes the structured behavioral stats we pass to Gemini.
 * This is the "pre-computation" step that turns raw trades into
 * the specific metrics the AI prompt needs.
 *
 * Gemini receives structured facts, not raw JSON.
 * This is what makes the analysis specific instead of generic.
 */
export interface BehavioralStats {
  totalTrades: number;
  winRate: number;
  avgWinSize: number;
  avgLossSize: number;
  sizeRatio: number;           // avgLossSize / avgWinSize — the key revenge metric
  marketOrderWinRate: number;
  limitOrderWinRate: number;
  marketOrderCount: number;
  limitOrderCount: number;
  winRateByDayPosition: {      // win rate for 1st, 2nd, 3rd, 4th+ trade of day
    first: number;
    second: number;
    third: number;
    fourthPlus: number;
  };
  winRateByMarket: Record<string, { wins: number; total: number; winRate: number }>;
  topLosingTrades: Trade[];    // worst 5 by P&L
  topWinningTrades: Trade[];   // best 5 by P&L
  derivativeWinRate: number;
  spotWinRate: number;
}

export function computeBehavioralStats(trades: Trade[]): BehavioralStats {
  const closedTrades = trades.filter((t) => t.pnl !== null);

  // Win/loss sizes
  const winners = closedTrades.filter((t) => t.pnl! > 0);
  const losers = closedTrades.filter((t) => t.pnl! < 0);

  const avgWinSize =
    winners.length > 0
      ? Math.round(winners.reduce((s, t) => s + t.size, 0) / winners.length * 100) / 100
      : 0;
  const avgLossSize =
    losers.length > 0
      ? Math.round(losers.reduce((s, t) => s + t.size, 0) / losers.length * 100) / 100
      : 0;
  const sizeRatio =
    avgWinSize > 0 ? Math.round((avgLossSize / avgWinSize) * 100) / 100 : 0;

  // Order type performance
  const marketTrades = closedTrades.filter((t) => t.orderType === 'MARKET');
  const limitTrades = closedTrades.filter((t) => t.orderType === 'LIMIT');

  const marketWins = marketTrades.filter((t) => t.pnl! > 0).length;
  const limitWins = limitTrades.filter((t) => t.pnl! > 0).length;

  const marketOrderWinRate =
    marketTrades.length > 0
      ? Math.round((marketWins / marketTrades.length) * 1000) / 10
      : 0;
  const limitOrderWinRate =
    limitTrades.length > 0
      ? Math.round((limitWins / limitTrades.length) * 1000) / 10
      : 0;

  // Daily fatigue pattern
  const tradesByDay: Record<string, Trade[]> = {};
  for (const trade of trades) {
    const day = trade.timestamp.split('T')[0];
    if (!tradesByDay[day]) tradesByDay[day] = [];
    tradesByDay[day].push(trade);
  }

  // Sort each day's trades chronologically
  for (const day of Object.keys(tradesByDay)) {
    tradesByDay[day].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  // Compute win rates by position in day
  const positionStats = { first: { w: 0, t: 0 }, second: { w: 0, t: 0 }, third: { w: 0, t: 0 }, fourthPlus: { w: 0, t: 0 } };

  for (const dayTrades of Object.values(tradesByDay)) {
    dayTrades.forEach((trade, idx) => {
      if (trade.pnl === null) return;
      const isWin = trade.pnl > 0;
      const key = idx === 0 ? 'first' : idx === 1 ? 'second' : idx === 2 ? 'third' : 'fourthPlus';
      positionStats[key].t++;
      if (isWin) positionStats[key].w++;
    });
  }

  const toRate = (s: { w: number; t: number }) =>
    s.t > 0 ? Math.round((s.w / s.t) * 1000) / 10 : 0;

  // Win rate by market
  const winRateByMarket: Record<string, { wins: number; total: number; winRate: number }> = {};
  for (const trade of closedTrades) {
    if (!winRateByMarket[trade.market]) {
      winRateByMarket[trade.market] = { wins: 0, total: 0, winRate: 0 };
    }
    winRateByMarket[trade.market].total++;
    if (trade.pnl! > 0) winRateByMarket[trade.market].wins++;
  }
  for (const key of Object.keys(winRateByMarket)) {
    const { wins, total } = winRateByMarket[key];
    winRateByMarket[key].winRate = Math.round((wins / total) * 1000) / 10;
  }

  // Top trades
  const sortedByPnl = [...closedTrades].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
  const topWinningTrades = sortedByPnl.slice(0, 5);
  const topLosingTrades = sortedByPnl.slice(-5).reverse();

  // Derivative vs spot
  const isDerivative = (t: Trade) => t.market.includes('-PERP') || t.market.includes('PERP');
  const derivTrades = closedTrades.filter(isDerivative);
  const spotTrades2 = closedTrades.filter((t) => !isDerivative(t));

  const derivWins = derivTrades.filter((t) => t.pnl! > 0).length;
  const spotWins = spotTrades2.filter((t) => t.pnl! > 0).length;

  return {
    totalTrades: trades.length,
    winRate: closedTrades.length > 0
      ? Math.round((winners.length / closedTrades.length) * 1000) / 10
      : 0,
    avgWinSize,
    avgLossSize,
    sizeRatio,
    marketOrderWinRate,
    limitOrderWinRate,
    marketOrderCount: marketTrades.length,
    limitOrderCount: limitTrades.length,
    winRateByDayPosition: {
      first: toRate(positionStats.first),
      second: toRate(positionStats.second),
      third: toRate(positionStats.third),
      fourthPlus: toRate(positionStats.fourthPlus),
    },
    winRateByMarket,
    topLosingTrades,
    topWinningTrades,
    derivativeWinRate: derivTrades.length > 0
      ? Math.round((derivWins / derivTrades.length) * 1000) / 10
      : 0,
    spotWinRate: spotTrades2.length > 0
      ? Math.round((spotWins / spotTrades2.length) * 1000) / 10
      : 0,
  };
}