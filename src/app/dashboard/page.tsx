"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Navigation } from '@/components/Navigation';
import { MOCK_TRADES, MOCK_ANALYSIS } from '@/lib/mock-data';
import { StatsStrip } from '@/components/StatsStrip';
import { TradeTable } from '@/components/TradeTable';
import { Button } from '@/components/ui/button';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { BrainCircuit, Info, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { isDemoMode, address } = useWallet();
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = () => {
    setIsLoading(true);
    // Simulate prep time for AI
    setTimeout(() => {
      setIsLoading(false);
      setIsAnalysisOpen(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {isDemoMode && (
        <div className="bg-status-amber py-2 px-6 flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-black" />
          <span className="text-sm font-bold text-black uppercase tracking-wider">
            Demo Mode Active: Viewing simulated trading behavior report
          </span>
        </div>
      )}

      <main className="flex-1 container mx-auto px-6 py-8 flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1">Trading Dashboard</h1>
            <p className="text-muted-foreground">Real-time performance and behavioral analysis</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-card border border-white/5 px-4 py-2 rounded-md flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono-data text-muted-foreground">NETWORK: COSMOS-HUB</span>
            </div>
          </div>
        </header>

        <StatsStrip trades={MOCK_TRADES} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trade History */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold">Trade History</h2>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">{MOCK_TRADES.length} POSITIONS</span>
            </div>
            <TradeTable trades={MOCK_TRADES} />
          </div>

          {/* AI Analysis Sidebar Card */}
          <div className="flex flex-col gap-6">
            <div className="insight-card rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit className="w-24 h-24" />
              </div>
              
              <div>
                <h2 className="text-2xl font-headline font-bold mb-2 flex items-center gap-2">
                  AI Behavioral Coach
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Run a comprehensive scan of your on-chain history to uncover the mental 
                  framework behind your trades.
                </p>
              </div>

              <Button 
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-8 text-lg font-bold bg-primary text-black hover:bg-primary/90 animate-pulse-glow relative z-10"
              >
                {isLoading ? 'Analyzing History...' : 'Analyze My Trading'}
              </Button>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex gap-3">
                  <Sparkles className="text-primary w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Hidden Edges</h4>
                    <p className="text-xs text-muted-foreground">Identify where you consistently outperform the market.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <AlertCircle className="text-status-sell w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Risk Blind Spots</h4>
                    <p className="text-xs text-muted-foreground">Expose patterns that lead to unforced losses.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TrendingUp className="text-secondary w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Growth Focus</h4>
                    <p className="text-xs text-muted-foreground">Actionable advice for the coming trade week.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-muted-foreground">System Health</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Latency</span>
                  <span className="font-mono-data text-primary">24ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Data Freshness</span>
                  <span className="font-mono-data text-primary">99.8%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>AI Engine</span>
                  <span className="font-mono-data text-primary">v2.5 Flash</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnalysisPanel 
        isOpen={isAnalysisOpen} 
        onOpenChange={setIsAnalysisOpen} 
        fullContent={MOCK_ANALYSIS} 
      />
    </div>
  );
}
