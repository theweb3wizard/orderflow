# OrderFlow — AI Behavioral Trading Journal for Injective

> *Find out why you're losing on Injective.*

**Live Demo:** https://orderflow-hq.vercel.app

OrderFlow connects to your Injective wallet, fetches your complete on-chain trading history from the Injective Exchange Module, and uses Gemini AI to analyze your behavioral patterns — telling you specifically why you're losing money and what you're doing well.

---

## The Problem

Every serious trader on Injective Helix knows this feeling: you're making trades, losing money on some, winning on others, but you have no idea *why*. The patterns are in your data. You just can't see them.

Existing tools show you charts and P&L numbers. None of them tell you that you're sizing up 2.7x on losing trades, or that your win rate drops from 71% to 44% after your third trade of the day, or that your limit orders outperform your market orders by 23 percentage points.

OrderFlow does.

---

## Why Injective

OrderFlow is built specifically for Injective and could not exist in its current form on any other chain. Three reasons:

**1. Unified Exchange API**
Injective's Exchange Module makes all trading data — spot and derivatives — queryable through a single, unified indexer API. On Ethereum, trades are fragmented across 50+ DEXs with no unified data layer. On Injective, one API call returns a trader's complete history across all markets.

**2. Native On-Chain Orderbook**
Injective's CLOB (Central Limit Order Book) is fully on-chain. Every limit order, market order, and fill is indexed and publicly verifiable. This means the behavioral analysis OrderFlow provides — market orders vs. limit orders, order timing, position sizing — is based on real, tamper-proof on-chain data.

**3. Meaningful Data for AI Analysis**
Because Injective tracks both spot and derivative trades with explicit P&L data for derivatives, OrderFlow can compute behavioral statistics that are genuinely insightful: revenge trading patterns, daily fatigue curves, market-specific edge analysis.

---

## Features

- **Wallet Connection** — Connect with MetaMask (Injective EVM) or Keplr
- **Real On-Chain Data** — Fetches up to 300 trades from Injective's live indexer
- **Behavioral Pre-Analysis** — Computes 12 behavioral metrics before the AI sees the data
- **AI Analysis** — Gemini AI produces a 4-section behavioral report with specific numbers
- **Streaming Output** — Analysis streams word-by-word in real time
- **Shareable Reports** — Save and share your analysis via a public URL
- **Demo Mode** — Full experience without connecting a wallet
- **Verify On-Chain** — Every trade row links directly to Injective Explorer

---

## How It Works

```
User connects wallet (MetaMask or Keplr)
           ↓
/api/fetch-trades derives subaccount ID
           ↓
Injective SDK fetches spot + derivative trades (up to 300)
           ↓
normalize.ts converts raw API data → unified Trade shape
           ↓
computeBehavioralStats() calculates 12 behavioral metrics
           ↓
Gemini AI receives structured stats (not raw JSON)
           ↓
4-section analysis streams to UI in real time
           ↓
User saves report → shareable public URL
```

The key architectural decision: Gemini receives **pre-computed structured statistics**, not raw trade JSON. This produces specific, data-grounded insights instead of generic advice.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, ShadCN UI |
| Blockchain | Injective SDK (`@injectivelabs/sdk-ts`) |
| AI | Google Gemini 1.5 Flash via Genkit |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

---

## Injective Integration Details

**SDK:** `@injectivelabs/sdk-ts` v1.18.8

**API Calls:**
```typescript
// Spot trades
IndexerGrpcSpotApi.fetchTrades({ subaccountId, pagination })

// Derivative trades  
IndexerGrpcDerivativesApi.fetchSubaccountTradesList({ subaccountId, pagination })

// Market metadata
IndexerGrpcSpotApi.fetchMarkets({})
IndexerGrpcDerivativesApi.fetchMarkets({})
```

**Subaccount derivation:**
```typescript
const ethereumAddress = getEthereumAddress(injectiveAddress);
const subaccountId = '0x' + hex + '0'.repeat(24); // index 0
```

**Network:** Injective Mainnet (`injective-1`)

---

## Running Locally

```bash
git clone https://github.com/theweb3wizard/orderflow
cd orderflow
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

```bash
npm run dev
```

Open `http://localhost:9002`

---

## Demo

**Live:** https://orderflow-hq.vercel.app

**Demo wallet:** Click "View Demo" on the landing page — no wallet connection required.

**Judge walkthrough:**
1. Open the live URL
2. Click "View Demo"
3. Click "Analyze My Trading"
4. Watch the AI behavioral analysis stream in real time
5. Navigate to `/report/demo` for the public shareable report

---

## Database Schema

```sql
users          — wallet address, first seen, last active
reports        — analysis text, trade count, markets, shareable ID  
trade_cache    — 5-minute TTL cache of Injective API responses
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # Main app
│   ├── report/[id]/page.tsx        # Public report
│   └── api/
│       ├── fetch-trades/route.ts   # Injective SDK integration
│       ├── analyze/route.ts        # Gemini streaming analysis
│       └── save-report/route.ts    # Supabase persistence
├── lib/
│   ├── injective.ts                # SDK client + trade fetching
│   ├── normalize.ts                # Trade normalization + behavioral stats
│   └── mock-data.ts                # Demo data with behavioral patterns
├── ai/
│   └── flows/analyze-trading-behavior-flow.ts  # Genkit AI flow
└── components/
    ├── AnalysisPanel.tsx            # Streaming analysis UI
    ├── TradeTable.tsx               # Paginated trade history
    ├── StatsStrip.tsx               # Key metrics display
    └── WalletModal.tsx              # MetaMask + Keplr connection
```

---

## Built For

**Injective Africa Buildathon 2026**

Built by Khalid Murtala (@theweb3wizard) — solo builder, 18-year-old CS student, The Web3 Wizard.

---

*OrderFlow — Trade with the clarity of AI behavioral coaching.*