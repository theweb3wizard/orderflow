/**
 * src/app/api/save-report/route.ts
 *
 * POST /api/save-report
 * Accepts: { walletAddress, analysisText, tradeCount, markets }
 * Returns: { reportId, url }
 */

export const runtime = 'nodejs';
export const maxDuration = 15;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, analysisText, tradeCount, markets } = body as {
      walletAddress: string;
      analysisText: string;
      tradeCount: number;
      markets: string[];
    };

    if (!walletAddress || !analysisText) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Upsert user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          injective_address: walletAddress,
          last_active_at: new Date().toISOString(),
          trade_count: tradeCount,
        },
        { onConflict: 'injective_address' }
      )
      .select('id')
      .single();

    if (userError) {
      console.error('[save-report] User upsert error:', userError);
      // Non-fatal — continue without user_id
    }

    // Insert report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: user?.id ?? null,
        trade_count: tradeCount,
        analysis_text: analysisText,
        markets_traded: markets ?? [],
        is_public: true,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (reportError || !report) {
      console.error('[save-report] Report insert error:', reportError);
      return NextResponse.json(
        { error: 'Failed to save report', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reportId: report.id,
      url: `/report/${report.id}`,
    });

  } catch (err: any) {
    console.error('[save-report] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}