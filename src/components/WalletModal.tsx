"use client";

// src/components/WalletModal.tsx
// Real wallet connection modal — opens MetaMask or Keplr, no fake addresses.

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ isOpen, onOpenChange }: WalletModalProps) {
  const { connectMetaMask, connectKeplr } = useWallet();
  const { toast } = useToast();
  const router = useRouter();
  const [connecting, setConnecting] = useState<'metamask' | 'keplr' | null>(null);

  const handleMetaMask = async () => {
    setConnecting('metamask');
    try {
      await connectMetaMask();
      onOpenChange(false);
      toast({
        title: "MetaMask connected",
        description: "Fetching your Injective trading history...",
      });
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: "Connection failed",
        description: err.message ?? "Could not connect MetaMask.",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleKeplr = async () => {
    setConnecting('keplr');
    try {
      await connectKeplr();
      onOpenChange(false);
      toast({
        title: "Keplr connected",
        description: "Fetching your Injective trading history...",
      });
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: "Connection failed",
        description: err.message ?? "Could not connect Keplr.",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const isConnecting = connecting !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#13131A] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-white">
            Connect Your Wallet
          </DialogTitle>
          <p className="text-center text-sm text-[#8B8B9E] mt-1">
            Connect to load your real Injective trading history
          </p>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {/* MetaMask */}
          <button
            onClick={handleMetaMask}
            disabled={isConnecting}
            className="h-16 flex items-center gap-4 px-6 rounded-xl border border-white/10 hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left w-full"
          >
            {connecting === 'metamask' ? (
              <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                M
              </div>
            )}
            <div>
              <div className="font-semibold text-white text-sm">MetaMask</div>
              <div className="text-xs text-[#8B8B9E]">
                {connecting === 'metamask' ? 'Connecting...' : 'Connect via Injective EVM'}
              </div>
            </div>
          </button>

          {/* Keplr */}
          <button
            onClick={handleKeplr}
            disabled={isConnecting}
            className="h-16 flex items-center gap-4 px-6 rounded-xl border border-white/10 hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left w-full"
          >
            {connecting === 'keplr' ? (
              <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-[#6366F1] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                K
              </div>
            )}
            <div>
              <div className="font-semibold text-white text-sm">Keplr Wallet</div>
              <div className="text-xs text-[#8B8B9E]">
                {connecting === 'keplr' ? 'Connecting...' : 'Native Injective wallet'}
              </div>
            </div>
          </button>
        </div>

        {/* Install links if wallets not detected */}
        <p className="text-center text-xs text-[#8B8B9E] pb-2">
          Don't have a wallet?{' '}
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D4FF] hover:underline"
          >
            Get MetaMask
          </a>
          {' '}or{' '}
          <a
            href="https://www.keplr.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D4FF] hover:underline"
          >
            Get Keplr
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}