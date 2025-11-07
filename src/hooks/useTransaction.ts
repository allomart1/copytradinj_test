import { useState } from 'react';
import { transactionService, GasEstimate, TransactionResult } from '../services/transactionService';

export function useTransaction() {
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimateGas = async (msg: any) => {
    setIsEstimating(true);
    setError(null);
    try {
      const estimate = await transactionService.estimateGas(msg);
      setGasEstimate(estimate);
      return estimate;
    } catch (err: any) {
      setError(err.message || 'Failed to estimate gas');
      return null;
    } finally {
      setIsEstimating(false);
    }
  };

  const signAndBroadcast = async (
    walletAddress: string,
    msg: any,
    walletType: 'keplr' | 'leap',
    usdtBalance: number
  ): Promise<TransactionResult> => {
    setIsSigning(true);
    setError(null);
    
    try {
      // Validate transaction first
      const validation = await transactionService.validateTransaction(
        walletAddress,
        msg,
        usdtBalance
      );

      if (!validation.valid) {
        setError(validation.error || 'Transaction validation failed');
        return { success: false, error: validation.error };
      }

      // Sign and broadcast with retry
      const result = await transactionService.retryTransaction(
        walletAddress,
        msg,
        walletType,
        3 // Max 3 retries
      );

      if (!result.success) {
        setError(result.error || 'Transaction failed');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Transaction failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSigning(false);
    }
  };

  const reset = () => {
    setGasEstimate(null);
    setError(null);
    setIsEstimating(false);
    setIsSigning(false);
  };

  return {
    gasEstimate,
    isEstimating,
    isSigning,
    error,
    estimateGas,
    signAndBroadcast,
    reset,
  };
}
