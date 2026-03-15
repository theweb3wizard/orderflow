export interface Trade {
  id: string;
  market: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  status: 'OPEN' | 'CLOSED';
  size: number;        // USDT-denominated trade size (what the table shows)
  price: number;       // Entry price for the asset
  exitPrice: number | null;
  pnl: number | null;  // null for unclosed spot, number for derivatives and closed spot
  timestamp: string;
  txHash: string;
}

/**
 * Generates 200 mock trades with 4 baked-in behavioral patterns:
 * 1. Revenge Scaling: Size increases 80–200% after a losing trade (MARKET order bias)
 * 2. Limit Edge: LIMIT orders win ~61% of the time vs ~38% for MARKET orders
 * 3. Daily Fatigue: Win rate drops sharply after 3rd trade of the same calendar day
 * 4. Derivative Alpha: BTC/USDT-PERP trades have genuine positive expectancy
 */
const generateMockTrades = (count: number): Trade[] => {
  const trades: Trade[] = [];
  const baseDate = new Date('2026-03-15T12:00:00Z');

  // Markets: spot and one derivative (BTC/USDT-PERP)
  const spotMarkets = ['INJ/USDT', 'ETH/USDT', 'SOL/USDT', 'ATOM/USDT', 'TIA/USDT'];
  const derivativeMarket = 'BTC/USDT-PERP';

  // Realistic price ranges per market
  const priceRanges: Record<string, [number, number]> = {
    'INJ/USDT':       [18, 26],
    'ETH/USDT':       [2000, 3500],
    'SOL/USDT':       [120, 200],
    'ATOM/USDT':      [6, 12],
    'TIA/USDT':       [3, 8],
    'BTC/USDT-PERP':  [85000, 105000],
  };

  // Track trades per calendar day for fatigue pattern
  const tradesPerDay: Record<string, number> = {};

  for (let i = 0; i < count; i++) {
    // Spread trades across 90 days, more on weekdays
    const daysBack = Math.floor(i * (90 / count)) + Math.floor(Math.random() * 3);
    const tradeDate = new Date(baseDate);
    tradeDate.setDate(tradeDate.getDate() - daysBack);
    tradeDate.setHours(
      8 + Math.floor(Math.random() * 14),
      Math.floor(Math.random() * 60),
      0, 0
    );
    const dayKey = tradeDate.toISOString().split('T')[0];
    tradesPerDay[dayKey] = (tradesPerDay[dayKey] || 0) + 1;
    const tradeIndexInDay = tradesPerDay[dayKey];

    // Last trade reference for revenge pattern
    const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;
    const wasLastTradeLoss = lastTrade?.pnl !== undefined && lastTrade.pnl !== null && lastTrade.pnl < 0;

    // 20% chance of derivative trade, otherwise spot
    const isDerivative = Math.random() < 0.2;
    const market = isDerivative
      ? derivativeMarket
      : spotMarkets[Math.floor(Math.random() * spotMarkets.length)];

    const [minPrice, maxPrice] = priceRanges[market];
    const price = minPrice + Math.random() * (maxPrice - minPrice);

    // BEHAVIORAL PATTERN 1 — Revenge Scaling
    // Base size: $100–$800 USDT for most trades
    let baseSize = 100 + Math.random() * 700;
    let orderType: 'MARKET' | 'LIMIT' = Math.random() < 0.32 ? 'LIMIT' : 'MARKET';

    if (wasLastTradeLoss) {
      baseSize *= (1.8 + Math.random());  // 80–280% size increase after a loss
      orderType = 'MARKET';               // Emotional re-entry, always market order
    }
    const size = Math.round(baseSize * 100) / 100;

    // Direction: slight buy bias
    const type: 'BUY' | 'SELL' = Math.random() < 0.55 ? 'BUY' : 'SELL';

    // BEHAVIORAL PATTERN 2 — Limit Edge
    // MARKET orders: ~38% win rate baseline
    // LIMIT orders: ~61% win rate baseline
    const baseWinRate = orderType === 'LIMIT' ? 0.61 : 0.38;

    // BEHAVIORAL PATTERN 3 — Daily Fatigue
    // Trade 1: full win rate. Trade 2: -10%. Trade 3: -18%. Trade 4+: -30%.
    const fatiguePenalty = tradeIndexInDay === 1 ? 0
      : tradeIndexInDay === 2 ? 0.10
      : tradeIndexInDay === 3 ? 0.18
      : 0.30;

    const effectiveWinRate = Math.max(0.05, baseWinRate - fatiguePenalty);
    const isWinner = Math.random() < effectiveWinRate;

    // BEHAVIORAL PATTERN 4 — Derivative Alpha
    // BTC/USDT-PERP has a modest positive expectancy
    const performanceMult = isDerivative
      ? (isWinner ? 0.03 + Math.random() * 0.04 : -(0.01 + Math.random() * 0.025))
      : (isWinner ? 0.02 + Math.random() * 0.05 : -(0.02 + Math.random() * 0.06));

    // Most trades are closed; keep a few open for realism
    const isClosed = i > 8;
    const exitPrice = isClosed ? price * (1 + performanceMult) : null;

    // P&L in USDT: size × percentage move (direction-adjusted)
    const pnl = isClosed && exitPrice !== null
      ? Math.round(size * performanceMult * (type === 'BUY' ? 1 : -1) * 100) / 100
      : null;

    // Realistic-looking tx hash
    const hashChars = '0123456789abcdef';
    const randomHex = (len: number) =>
      Array.from({ length: len }, () => hashChars[Math.floor(Math.random() * 16)]).join('');
    const txHash = `0x${randomHex(40)}`;

    trades.push({
      id: `TRD-${1000 + i}`,
      market,
      type,
      orderType,
      status: isClosed ? 'CLOSED' : 'OPEN',
      size,
      price: Math.round(price * 100) / 100,
      exitPrice: exitPrice ? Math.round(exitPrice * 100) / 100 : null,
      pnl,
      timestamp: tradeDate.toISOString(),
      txHash,
    });
  }

  return trades;
};

export const MOCK_TRADES = generateMockTrades(200);

// Pre-written analysis matching exactly the section headers AnalysisPanel.tsx expects
export const MOCK_ANALYSIS = `## YOUR TRADING DNA
You are a **momentum-driven reactive trader** operating across Injective's spot and derivatives markets. Over 200 trades across 90 days, your activity clusters around high-volatility periods — which tells us you trade on market energy rather than a systematic plan. Your BTC/USDT-PERP derivatives exposure shows genuine analytical ability. Your spot trading habits are quietly bleeding that edge dry.

## YOUR 3 BIGGEST BLIND SPOTS
**Blind Spot 1 — You size up on emotion, and emotion is expensive.** Your average losing trade is **$847 USDT**. Your average winning trade is **$312 USDT**. You are risking **2.7x more capital** on the trades you end up losing. This single pattern accounts for **64% of your total drawdown** over the last 90 days.

**Blind Spot 2 — Market orders are a tax you keep paying voluntarily.** Your LIMIT orders win **61% of the time**. Your MARKET orders win **38% of the time**. That 23-point gap is not noise — it is the cost of impatience. Yet **68% of your trades are market orders**. You are choosing the inferior tool on the majority of your entries.

**Blind Spot 3 — You revenge trade, and the timestamps prove it.** Your first trade of each day wins **71% of the time**. Your second: **52%**. Your third: **44%**. Every trade after your third in a single day has a **negative expected value**. After the loss in TRD-1042, your next four positions were each **3.2x your normal size** and all executed via MARKET orders within 22 minutes.

## YOUR HIDDEN EDGES
Your **BTC/USDT-PERP** derivatives trades are genuinely profitable — a **58% win rate** with an average gain of **$340 per winning trade**. You have real alpha in derivatives when you are patient enough to use it. Your **ATOM/USDT** spot trades also show a **63% win rate**, suggesting you understand that market's rhythms better than others. These two markets are where your edge actually lives. Everything else is noise you are paying to generate.

## THIS WEEK'S FOCUS
**Hard rule: maximum 3 trades per calendar day.** No exceptions. Do not open a fourth trade under any circumstance this week. Log your P&L after trade 1, 2, and 3 separately in a notes app. You will see the pattern with your own eyes within 4 days. Change nothing else yet — isolate one variable at a time. The data already knows what is wrong. Now you do too.`;