"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Navigation } from '@/components/Navigation';
import { MOCK_TRADES, MOCK_ANALYSIS, Trade } from '@/lib/mock-data';
import { StatsStrip } from '@/components/StatsStrip';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Calendar, Hash } from 'lucide-react';

export default function ReportPage() {
  const { address } = useWallet();
  const router = useRouter();
  const params = useParams();
  const [trades, setTrades] = useState<Trade[]>([]);
  
  const reportWallet = "0x71...d897";
  const reportDate = "October 24, 2024";

  useEffect(() => {
    setTrades(MOCK_TRADES.slice(0, 50));
  }, []);

  const renderContent = (text: string) => {
    const sections = text.split(/(## [A-Z0-9 ]+)/g);
    return sections.map((part, i) => {
      if (part.startsWith('## ')) {
        return <h2 key={i}>{part.replace('## ', '')}</h2>;
      }
      
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i}>
          {boldParts.map((bp, j) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={j} className="text-white font-bold">{bp.slice(2, -2)}</strong>;
            }
            return bp;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-6 py-12 max-w-4xl">
        <header className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="text-xs font-bold uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">PUBLIC REPORT</span>
              <span className="text-xs text-muted-foreground font-mono-data">ID: {params.id}</span>
            </div>
            <h1 className="text-4xl font-headline font-bold">Behavioral Trading Audit</h1>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-4 h-4" />
              <div className="text-xs">
                <div className="text-white font-mono-data">{reportWallet}</div>
                <div>WALLET</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <div className="text-xs">
                <div className="text-white font-mono-data">{reportDate}</div>
                <div>GENERATED</div>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-12">
          <StatsStrip trades={trades} />
        </div>

        <div className="insight-card rounded-2xl p-10 font-body analysis-content mb-12">
          {renderContent(MOCK_ANALYSIS)}
        </div>

        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-headline font-bold mb-4 text-white normal-case tracking-normal m-0">
            Want to see your own edges?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Connect your wallet to analyze your on-chain history and get personalized 
            behavioral insights in seconds.
          </p>
          <Button 
            size="lg" 
            onClick={() => router.push('/')}
            className="bg-primary text-black font-bold hover:bg-primary/90 px-10 py-7 text-lg"
          >
            Analyze Your Own Trades <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </section>
      </main>
    </div>
  );
}