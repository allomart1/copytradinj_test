import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, TrendingUp, TrendingDown, DollarSign, Zap } from 'lucide-react';
import { GasEstimate } from '../services/transactionService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  trade: {
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    leverage: number;
  };
  gasEstimate: GasEstimate | null;
  isLoading: boolean;
  error: string | null;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onConfirm,
  trade,
  gasEstimate,
  isLoading,
  error,
}: TransactionModalProps) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onClose();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const notionalValue = trade.size * trade.entryPrice;
  const margin = notionalValue / trade.leverage;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Confirm Trade</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#171717] rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-[#A3A3A3]" />
          </button>
        </div>

        {/* Trade Details */}
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-[#171717] border border-[#2F2F2F] rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                trade.side === 'long' 
                  ? 'bg-[#10b981]/10 border border-[#10b981]/20' 
                  : 'bg-[#ef4444]/10 border border-[#ef4444]/20'
              }`}>
                {trade.side === 'long' ? (
                  <TrendingUp className="w-6 h-6 text-[#10b981]" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-[#ef4444]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{trade.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    trade.side === 'long' 
                      ? 'bg-[#10b981]/10 text-[#10b981]' 
                      : 'bg-[#ef4444]/10 text-[#ef4444]'
                  }`}>
                    {trade.side.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-[#A3A3A3]">Market Order</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#A3A3A3] mb-1">Size</p>
                <p className="text-white font-semibold">{trade.size.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-[#A3A3A3] mb-1">Leverage</p>
                <p className="text-white font-semibold">{trade.leverage}x</p>
              </div>
              <div>
                <p className="text-xs text-[#A3A3A3] mb-1">Entry Price</p>
                <p className="text-white font-semibold">${trade.entryPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-[#A3A3A3] mb-1">Margin</p>
                <p className="text-white font-semibold">${margin.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Gas Estimate */}
          {gasEstimate && (
            <div className="p-4 bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#38bdf8]" />
                <span className="text-sm font-semibold text-white">Gas Estimate</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#A3A3A3]">Gas Limit</span>
                  <span className="text-white font-mono">{gasEstimate.gasLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A3A3A3]">Gas Fee</span>
                  <span className="text-white font-mono">{gasEstimate.gasFeeInINJ} INJ</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#38bdf8]/20">
                  <span className="text-[#A3A3A3]">Estimated Cost</span>
                  <span className="text-[#38bdf8] font-semibold">${gasEstimate.totalCostUSD}</span>
                </div>
              </div>
            </div>
          )}

          {/* Total Cost */}
          <div className="p-4 bg-[#9E7FFF]/10 border border-[#9E7FFF]/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#9E7FFF]" />
                <span className="text-sm font-semibold text-white">Total Required</span>
              </div>
              <span className="text-lg font-bold text-[#9E7FFF]">
                ${(margin + parseFloat(gasEstimate?.totalCostUSD || '0')).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#ef4444] mb-1">Transaction Failed</p>
                <p className="text-xs text-[#ef4444]/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-[#171717] border border-[#2F2F2F] text-white rounded-xl font-semibold hover:border-[#9E7FFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9E7FFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm Trade
              </>
            )}
          </button>
        </div>

        {/* Countdown */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#A3A3A3]">
            Auto-closing in {countdown}s
          </p>
        </div>
      </div>
    </div>
  );
}
