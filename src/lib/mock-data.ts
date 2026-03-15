
export interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  status: 'OPEN' | 'CLOSED';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  timestamp: string;
}

const generateMockTrades = (count: number): Trade[] => {
  const trades: Trade[] = [];
  const baseDate = new Date();
  
  for (let i = 0; i < count; i++) {
    const isClosed = i > 10; // First few are open
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const orderType = Math.random() > 0.7 ? 'LIMIT' : 'MARKET';
    const entryPrice = 1500 + Math.random() * 500;
    const exitPrice = isClosed ? entryPrice * (1 + (Math.random() * 0.1 - 0.04)) : null;
    const quantity = 0.1 + Math.random() * 2;
    const pnl = isClosed && exitPrice ? (exitPrice - entryPrice) * quantity * (type === 'BUY' ? 1 : -1) : null;
    
    const date = new Date(baseDate);
    date.setHours(date.getHours() - i * 2);

    trades.push({
      id: `TRD-${1000 + i}`,
      type,
      orderType,
      status: isClosed ? 'CLOSED' : 'OPEN',
      entryPrice,
      exitPrice,
      quantity,
      pnl,
      timestamp: date.toISOString(),
    });
  }
  return trades;
};

export const MOCK_TRADES = generateMockTrades(200);

export const MOCK_ANALYSIS = `## BEHAVIORAL PATTERNS
Your trading history reveals a strong tendency towards 'Revenge Trading' following minor losses. Specifically, after Trade ID TRD-1042 (a SELL at $1642.50 which resulted in a PnL of -$145.20), you immediately entered three high-leverage MARKET orders within 15 minutes. This suggests emotional decision-making rather than strategy-based execution.

## BLIND SPOTS
You consistently struggle with 'Exit Fatigue' on winning positions. Data from Trade ID TRD-1088 and TRD-1102 shows that you held onto 10% profit positions until they retraced to break-even or minor losses. This 'Round Tripping' of profits has cost you an estimated $1,240 in realized gains over the last 30 days.

## HIDDEN EDGES
You have a remarkable success rate with LIMIT orders placed during low-volatility Asian market hours. Trade ID TRD-1156, a LIMIT BUY that executed at $1520.10, exemplifies your ability to pick local bottoms when not pressured by high-frequency movements. Your win rate for LIMIT orders is 68% compared to 42% for MARKET orders.

## WEEKLY FOCUS
1. Implement a 'Cool Down' timer: After any realized loss exceeding $100, wait 2 hours before opening a new position to mitigate revenge trading impulses.
2. Tighten Stop Profits: For positions currently up >5%, move your stop loss to lock in at least 2% profit immediately to prevent round-tripping.`;
