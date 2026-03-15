"use client";

// src/hooks/use-wallet.ts
// Real wallet connection — MetaMask (window.ethereum) + Keplr (window.keplr)
// No fake addresses. No hardcoded values.

import { useState, useEffect } from 'react';

// ─── Global singleton state ───────────────────────────────────────────────────
// Shared across all components without requiring a Context provider

let globalState: {
  address: string | null;   // inj1... or 0x... depending on wallet
  isDemoMode: boolean;
  isConnecting: boolean;
  walletType: 'keplr' | 'metamask' | 'demo' | null;
  listeners: Array<() => void>;
} = {
  address: null,
  isDemoMode: false,
  isConnecting: false,
  walletType: null,
  listeners: [],
};

const notify = () => globalState.listeners.forEach((l) => l());

// ─── MetaMask connection ──────────────────────────────────────────────────────

async function connectMetaMask(): Promise<string> {
  if (typeof window === 'undefined') throw new Error('Not in browser');

  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
  }

  // Request account access
  const accounts: string[] = await ethereum.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please unlock MetaMask and try again.');
  }

  // Switch to Injective EVM network (chainId: 0x996 = 2454 decimal)
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x996' }],
    });
  } catch (switchError: any) {
    // Chain not added yet — add it
    if (switchError.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x996',
            chainName: 'Injective',
            nativeCurrency: { name: 'Injective', symbol: 'INJ', decimals: 18 },
            rpcUrls: ['https://inevm.calderachain.xyz/http'],
            blockExplorerUrls: ['https://explorer.injective.network/'],
          },
        ],
      });
    }
    // If user rejects network switch, continue with current address anyway
    // The fetch-trades route handles 0x → inj1 conversion
  }

  return accounts[0]; // Returns 0x address — our API route converts it to inj1
}

// ─── Keplr connection ─────────────────────────────────────────────────────────

async function connectKeplr(): Promise<string> {
  if (typeof window === 'undefined') throw new Error('Not in browser');

  const keplr = (window as any).keplr;
  if (!keplr) {
    throw new Error('Keplr is not installed. Please install the Keplr browser extension and try again.');
  }

  const INJECTIVE_CHAIN_ID = 'injective-1';

  // Enable Keplr for Injective
  await keplr.enable(INJECTIVE_CHAIN_ID);

  const offlineSigner = keplr.getOfflineSigner(INJECTIVE_CHAIN_ID);
  const accounts = await offlineSigner.getAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error('No Keplr accounts found.');
  }

  return accounts[0].address; // Returns inj1... address directly
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWallet() {
  const [state, setState] = useState({
    address: globalState.address,
    isDemoMode: globalState.isDemoMode,
    isConnecting: globalState.isConnecting,
    walletType: globalState.walletType,
  });

  useEffect(() => {
    const listener = () =>
      setState({
        address: globalState.address,
        isDemoMode: globalState.isDemoMode,
        isConnecting: globalState.isConnecting,
        walletType: globalState.walletType,
      });
    globalState.listeners.push(listener);
    return () => {
      globalState.listeners = globalState.listeners.filter((l) => l !== listener);
    };
  }, []);

  const connectMetaMaskWallet = async (): Promise<void> => {
    globalState.isConnecting = true;
    notify();
    try {
      const address = await connectMetaMask();
      globalState.address = address;
      globalState.walletType = 'metamask';
      globalState.isDemoMode = false;
    } finally {
      globalState.isConnecting = false;
      notify();
    }
  };

  const connectKeplrWallet = async (): Promise<void> => {
    globalState.isConnecting = true;
    notify();
    try {
      const address = await connectKeplr();
      globalState.address = address;
      globalState.walletType = 'keplr';
      globalState.isDemoMode = false;
    } finally {
      globalState.isConnecting = false;
      notify();
    }
  };

  const disconnect = () => {
    globalState.address = null;
    globalState.isDemoMode = false;
    globalState.walletType = null;
    globalState.isConnecting = false;
    notify();
  };

  const setDemoMode = (val: boolean) => {
    globalState.isDemoMode = val;
    globalState.walletType = val ? 'demo' : null;
    globalState.address = val ? 'demo' : null;
    notify();
  };

  // Legacy connect() for any code still calling it directly
  const connect = (addr: string) => {
    globalState.address = addr;
    notify();
  };

  return {
    ...state,
    connect,
    connectMetaMask: connectMetaMaskWallet,
    connectKeplr: connectKeplrWallet,
    disconnect,
    setDemoMode,
  };
}