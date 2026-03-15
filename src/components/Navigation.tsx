
"use client";

import Link from 'next/link';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { WalletModal } from './WalletModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Navigation() {
  const { address, disconnect, setDemoMode } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  const handleDemo = () => {
    setDemoMode(true);
    router.push('/dashboard');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-headline font-bold flex items-center">
            Order<span className="text-primary">Flow</span>
          </Link>
          <button 
            onClick={handleDemo}
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            View Demo
          </button>
        </div>

        <div className="flex items-center gap-4">
          {address ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-mono-data text-sm text-muted-foreground bg-card px-3 py-1 rounded-md border border-white/5">
                <div className="w-2 h-2 rounded-full bg-status-buy shadow-[0_0_8px_rgba(0,208,132,0.8)]" />
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-xs">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      <WalletModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </nav>
  );
}
