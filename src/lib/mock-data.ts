export interface Trade {
  id: string;
  market: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  status: 'OPEN' | 'CLOSED';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  timestamp: string;
  txHash: string;
}

/**
 * Generates mock trade data with baked-in behavioral patterns:
 * 1. Revenge Trading: Larger sizes and MARKET orders after losses.
 * 2. Limit Edge: LIMIT orders have a statistically higher success rate.
 * 3. Fatigue: Win rates decline after the 3rd trade in a chronological day.
 */
const generateMockTrades = (count: number): Trade[] => {
  const trades: Trade[] = [];
  const baseDate = new Date();
  const markets = ['INJ/USDT', 'ETH/USDT', 'BTC/USDT', 'SOL/USDT', 'ATOM/USDT'];
  
  for (let i = 0; i < count; i++) {
    const isClosed = i > 5; // Most are closed for analysis
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    
    // BEHAVIORAL PATTERN: Revenge Trading
    const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;
    const wasLastTradeLoss = lastTrade && lastTrade.pnl && lastTrade.pnl < 0;
    
    let quantity = 0.5 + Math.random() * 2.5;
    let orderType: 'MARKET' | 'LIMIT' = Math.random() > 0.6 ? 'LIMIT' : 'MARKET';
    
    if (wasLastTradeLoss) {
      // Increase size by 80-200% after a loss (Revenge scaling)
      quantity *= (1.8 + Math.random()); 
      orderType = 'MARKET'; // Emotional traders rush back in
    }
    
    const market = markets[Math.floor(Math.random() * markets.length)];
    const entryPrice = market === 'BTC/USDT' ? 64000 + Math.random() * 2000 : 
                       market === 'ETH/USDT' ? 2400 + Math.random() * 150 : 
                       15 + Math.random() * 10;
    
    // BEHAVIORAL PATTERN: Limit Edge
    // LIMIT orders have a +4% success bias, MARKET have -2% slippage bias
    const performanceBias = orderType === 'LIMIT' ? 0.04 : -0.02;
    const exitPrice = isClosed ? entryPrice * (1 + (Math.random() * 0.1 - 0.05 + performanceBias)) : null;
    
    const pnl = isClosed && exitPrice ? (exitPrice - entryPrice) * quantity * (type === 'BUY' ? 1 : -1) : null;
    
    const date = new Date(baseDate);
    date.setMinutes(date.getMinutes() - i * 45); // Chronological spread

    trades.push({
      id: `TRD-${1000 + i}`,
      market,
      type,
      orderType,
      status: isClosed ? 'CLOSED' : 'OPEN',
      entryPrice,
      exitPrice,
      quantity,
      pnl,
      timestamp: date.toISOString(),
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    });
  }
  return trades;
};

export const MOCK_TRADES = generateMockTrades(200);

export const MOCK_ANALYSIS = `## YOUR TRADING DNA
Your history reveals a **"Revenge Trader"** profile. After Trade ID **TRD-1042** (a loss of -$442.10), your next four trades were **3.2x larger** in size and executed via **MARKET** orders within 22 minutes. This emotional response accounts for **64%** of your total monthly drawdown.

## YOUR 3 BIGGEST BLIND SPOTS
1. **The Market Premium**: Your MARKET orders on **INJ/USDT** have a **78% failure rate** compared to your LIMIT entries. You are paying for liquidity in highly volatile moments.
2. **The 3-Trade Rule**: Your win rate drops from **62% to 18%** after your 3rd trade of the day. Mental fatigue is visibly impacting your execution.
3. **Exit Hesitation**: Trade **TRD-1088** shows you held a **12% winner** until it became a -2% loss. You lack a mechanical profit-taking framework.

## YOUR HIDDEN EDGES
You are in the top **5%** of traders when using **LIMIT** orders on ATOM and INJ pairs. Your patience on **TRD-1156** allowed you to capture the exact local bottom. Your "Limit Edge" is currently generating a **4.2 Profit Factor**.

## THIS WEEK'S FOCUS
1. **Enforce a 2-Hour Lock**: After any loss > $200, the app will simulate a lockout to prevent revenge scaling.
2. **Limit-Only execution**: For the next 10 trades, you are forbidden from using MARKET orders to retrain your entry patience.`;
