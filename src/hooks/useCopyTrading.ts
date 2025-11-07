import { useState, useCallback, useEffect } from 'react';
import { useWallet } from './useWallet';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://copytradinj.blockval.io';

interface CopyTradingSession {
  walletAddress: string;
  targetWallet: string;
  amount: string;
  selectedAssets: string[];
  signature: string;
  timestamp: number;
}

export const useCopyTrading = () => {
  const { address, signMessage } = useWallet();
  const [isCopyTrading, setIsCopyTrading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there's an active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!address) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/copy-trading-status/${address}`);
        if (response.ok) {
          const data = await response.json();
          setIsCopyTrading(data.isActive || false);
        }
      } catch (err) {
        console.error('Failed to check copy trading status:', err);
      }
    };

    checkActiveSession();
  }, [address]);

  const startCopyTrading = useCallback(async (
    targetWallet: string,
    amount: string,
    selectedAssets: string[]
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting copy trading (NO SMART CONTRACT)...');
      console.log('📊 Configuration:', {
        walletAddress: address,
        targetWallet,
        amount,
        selectedAssets
      });

      // Step 1: Generate authorization signature
      const message = `Authorize CopyTradinj to execute trades on your behalf\n\nTarget Wallet: ${targetWallet}\nAmount: ${amount} USDT\nAssets: ${selectedAssets.join(', ')}\nTimestamp: ${Date.now()}`;
      
      const signature = await signMessage(message);
      console.log('✅ Authorization signature received:', signature.substring(0, 20) + '...');

      // Step 2: Save session locally
      const session: CopyTradingSession = {
        walletAddress: address,
        targetWallet,
        amount,
        selectedAssets,
        signature,
        timestamp: Date.now()
      };

      localStorage.setItem('copyTradingSession', JSON.stringify(session));
      console.log('✅ Session saved to localStorage');

      // Step 3: Register with backend (NO smart contract interaction)
      console.log('📝 Step 3: Registering with backend...');
      console.log('📤 Sending payload:', {
        walletAddress: address,
        targetWallet,
        amount,
        selectedAssets,
        signature: signature.substring(0, 20) + '...'
      });

      const response = await fetch(`${API_BASE_URL}/api/start-copy-trading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          targetWallet,
          amount,
          selectedAssets,
          signature
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Backend error response:', errorData);
        throw new Error(errorData.error || 'Failed to register with backend');
      }

      const data = await response.json();
      console.log('✅ Backend registration successful:', data);

      setIsCopyTrading(true);
      console.log('✅ Copy trading started successfully (backend only)');

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start copy trading';
      console.error('❌ Failed to start copy trading:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, signMessage]);

  const stopCopyTrading = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🛑 Stopping copy trading...');

      // Call backend to stop copy trading
      const response = await fetch(`${API_BASE_URL}/api/stop-copy-trading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop copy trading');
      }

      // Clear local session
      localStorage.removeItem('copyTradingSession');
      console.log('✅ Session cleared from localStorage');

      setIsCopyTrading(false);
      console.log('✅ Copy trading stopped successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop copy trading';
      console.error('❌ Failed to stop copy trading:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    isCopyTrading,
    isLoading,
    error,
    startCopyTrading,
    stopCopyTrading,
  };
};
