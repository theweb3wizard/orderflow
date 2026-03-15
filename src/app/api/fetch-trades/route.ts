/**
 * src/app/api/fetch-trades/route.ts
 *
 * POST /api/fetch-trades
 *
 * Accepts: { address: string }
 *   address — either inj1... (Keplr) or 0x... (MetaMask/EVM)
 *
 * Returns: { trades: Trade[], stats: TradeStats, cached: boolean }
 *   or:    { error: string, code: string }
 *
 * Flow:
 *   1. Validate and normalize the wallet address
 *   2. Check Supabase cache (5-min TTL) — return cached if fresh
 *   3. Fetch spot + derivative trades from Injective indexer in parallel
 *   4. Fetch market metadata (cached in-memory 10 min)
 *   5. Normalize all trades into unified Trade shape
 *   6. Compute stats
 *   7. Write to Supabase cache
 *   8. Return to client
 */

export const runtime = 'nodejs';
export const maxDuration = 30;  // 30s max — Injective fetches can be slow

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSpotTrades,
  fetchDerivativeTrades,
  getAllMarkets,
  toInjectiveAddress,
} from '@/lib/injective';
import { normalizeAllTrades, computeStats } from '@/lib/normalize';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client (server-side only) ──────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Cache TTL ────────────────────────────────────────────────────────────────

const CACHE_TTL_MINUTES = 5;
const DEMO_CACHE_TTL_MINUTES = 30;

// ─── Address normalization ────────────────────────────────────────────────────

function normalizeAddress(raw: string): { injectiveAddress: string; error?: string } {
  const trimmed = raw.trim().toLowerCase();

  if (trimmed.startsWith('inj1')) {
    // Already Injective bech32
    if (trimmed.length < 40) {
      return { injectiveAddress: '', error: 'Invalid Injective address length' };
    }
    return { injectiveAddress: trimmed };
  }

  if (trimmed.startsWith('0x')) {
    // MetaMask EVM address — convert to Injective bech32
    if (trimmed.length !== 42) {
      return { injectiveAddress: '', error: 'Invalid Ethereum address length' };
    }
    try {
      const injectiveAddress = toInjectiveAddress(trimmed);
      return { injectiveAddress };
    } catch {
      return { injectiveAddress: '', error: 'Failed to convert EVM address to Injective format' };
    }
  }

  return { injectiveAddress: '', error: 'Address must start with inj1 or 0x' };
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function getCachedTrades(injectiveAddress: string) {
  try {
    const { data, error } = await supabase
      .from('trade_cache')
      .select('trade_data, fetched_at, trade_count')
      .eq('injective_address', injectiveAddress)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

async function setCachedTrades(
  injectiveAddress: string,
  trades: any[],
  isDemo: boolean
) {
  try {
    const ttlMinutes = isDemo ? DEMO_CACHE_TTL_MINUTES : CACHE_TTL_MINUTES;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    await supabase.from('trade_cache').upsert(
      {
        injective_address: injectiveAddress,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        trade_data: trades,
        trade_count: trades.length,
      },
      { onConflict: 'injective_address' }
    );
  } catch (err) {
    // Cache write failure is non-fatal — log and continue
    console.error('[fetch-trades] Cache write failed:', err);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, isDemo } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid address', code: 'INVALID_ADDRESS' },
        { status: 400 }
      );
    }

    // Normalize address
    const { injectiveAddress, error: addrError } = normalizeAddress(address);
    if (addrError) {
      return NextResponse.json(
        { error: addrError, code: 'INVALID_ADDRESS' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = await getCachedTrades(injectiveAddress);
    if (cached) {
      const stats = computeStats(cached.trade_data);
      return NextResponse.json({
        trades: cached.trade_data,
        stats,
        cached: true,
        tradeCount: cached.trade_count,
      });
    }

    // Fetch from Injective in parallel
    const [spotRaw, derivRaw, allMarkets] = await Promise.all([
      fetchSpotTrades(injectiveAddress),
      fetchDerivativeTrades(injectiveAddress),
      getAllMarkets(),
    ]);

    // Normalize
    const trades = normalizeAllTrades(spotRaw, derivRaw, allMarkets);

    // Compute stats
    const stats = computeStats(trades);

    // Write to cache (non-blocking)
    setCachedTrades(injectiveAddress, trades, !!isDemo);

    // Upsert user record
    try {
      await supabase.from('users').upsert(
        {
          injective_address: injectiveAddress,
          last_active_at: new Date().toISOString(),
          trade_count: trades.length,
        },
        { onConflict: 'injective_address' }
      );
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      trades,
      stats,
      cached: false,
      tradeCount: trades.length,
    });

  } catch (err: any) {
    console.error('[fetch-trades] Unhandled error:', err);

    // Specific error for Injective indexer being down
    if (err?.message?.includes('UNAVAILABLE') || err?.message?.includes('timeout')) {
      return NextResponse.json(
        {
          error: 'Injective indexer is temporarily unavailable. Please try again in a moment.',
          code: 'INDEXER_UNAVAILABLE',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch trades', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}