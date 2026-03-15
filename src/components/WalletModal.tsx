"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface WalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ isOpen, onOpenChange }: WalletModalProps) {
  const { connect } = useWallet();
  const { toast } = useToast();
  const router = useRouter();

  const handleConnect = (wallet: string) => {
    // Fake wallet connection
    const fakeAddr = wallet === 'Keplr' 
      ? 'cosmos1p8r...9x2q' 
      : '0x71C765...d897';
    
    connect(fakeAddr);
    onOpenChange(false);
    toast({
      title: "Wallet connected successfully",
      description: `Linked to ${wallet} address ${fakeAddr.slice(0, 10)}...`,
    });
    router.push('/dashboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Connect your wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button 
            variant="outline" 
            className="h-16 justify-start gap-4 px-6 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => handleConnect('Keplr')}
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">K</div>
            <div className="text-left">
              <div className="font-semibold">Keplr Wallet</div>
              <div className="text-xs text-muted-foreground">Cosmos ecosystem</div>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 justify-start gap-4 px-6 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => handleConnect('MetaMask')}
          >
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold">M</div>
            <div className="text-left">
              <div className="font-semibold">MetaMask</div>
              <div className="text-xs text-muted-foreground">Ethereum ecosystem</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
