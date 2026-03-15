import { create } from 'zustand';

interface WalletState {
  address: string | null;
  isDemoMode: boolean;
  connect: (address: string) => void;
  disconnect: () => void;
  setDemoMode: (isDemo: boolean) => void;
}

import { useState, useEffect } from 'react';

// Using a simple hook instead of zustand to avoid extra dependencies if not needed, 
// but since we need it across components, let's just use a basic React state provider pattern if preferred.
// For simplicity in this scaffold, let's use a singleton-like state.

let globalState: {
  address: string | null;
  isDemoMode: boolean;
  listeners: Array<() => void>;
} = {
  address: null,
  isDemoMode: false,
  listeners: [],
};

const notify = () => globalState.listeners.forEach(l => l());

export function useWallet() {
  const [state, setState] = useState({ 
    address: globalState.address, 
    isDemoMode: globalState.isDemoMode 
  });

  useEffect(() => {
    const listener = () => setState({ 
      address: globalState.address, 
      isDemoMode: globalState.isDemoMode 
    });
    globalState.listeners.push(listener);
    return () => {
      globalState.listeners = globalState.listeners.filter(l => l !== listener);
    };
  }, []);

  return {
    ...state,
    connect: (addr: string) => {
      globalState.address = addr;
      notify();
    },
    disconnect: () => {
      globalState.address = null;
      globalState.isDemoMode = false;
      notify();
    },
    setDemoMode: (val: boolean) => {
      globalState.isDemoMode = val;
      if (val) globalState.address = '0xDemo...42f';
      notify();
    }
  };
}
