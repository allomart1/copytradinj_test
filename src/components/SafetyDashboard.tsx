import { Shield, AlertTriangle, TrendingDown, Activity, DollarSign, Zap } from 'lucide-react';
import { safetyService } from '../services/safetyService';

interface SafetyDashboardProps {
  walletAddress: string;
  currentBalance: number;
}

export default function SafetyDashboard({ walletAddress, currentBalance }: SafetyDashboardProps) {
  const status = safetyService.getSafetyStatus(walletAddress, currentBalance);
  const limits = safetyService.getLimits();

  const tradesPercentage = (status.dailyTradesUsed / status.dailyTradesLimit) * 100;
  const volumePercentage = (status.dailyVolumeUsed / status.dailyVolumeLimit) * 100;

  return (
    <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Safety Dashboard</h2>
          <p className="text-xs text-[#A3A3A3]">Real-time risk monitoring</p>
        </div>
      </div>

      {/* Circuit Breaker Alert */}
      {status.circuitBreakerActive && (
        <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#ef4444] mb-1">Circuit Breaker Active</p>
              <p className="text-xs text-[#ef4444]/80">
                Trading paused due to daily loss limit. Loss: {Math.abs(status.dailyPnLPercent).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Stats */}
      <div className="space-y-4">
        {/* Daily P&L */}
        <div className="p-4 bg-[#171717] border border-[#2F2F2F] rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[#A3A3A3]" />
              <span className="text-sm text-[#A3A3A3]">Daily P&L</span>
            </div>
            <span className={`text-lg font-bold ${
              status.dailyPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
            }`}>
              {status.dailyPnL >= 0 ? '+' : ''}${status.dailyPnL.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A3A3A3]">Percentage</span>
            <span className={status.dailyPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}>
              {status.dailyPnL >= 0 ? '+' : ''}{status.dailyPnLPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Daily Trades */}
        <div className="p-4 bg-[#171717] border border-[#2F2F2F] rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#A3A3A3]" />
              <span className="text-sm text-[#A3A3A3]">Daily Trades</span>
            </div>
            <span className="text-sm text-white font-semibold">
              {status.dailyTradesUsed} / {status.dailyTradesLimit}
            </span>
          </div>
          <div className="w-full bg-[#262626] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                tradesPercentage > 80 ? 'bg-[#ef4444]' : 'bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8]'
              }`}
              style={{ width: `${Math.min(tradesPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Daily Volume */}
        <div className="p-4 bg-[#171717] border border-[#2F2F2F] rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#A3A3A3]" />
              <span className="text-sm text-[#A3A3A3]">Daily Volume</span>
            </div>
            <span className="text-sm text-white font-semibold">
              ${status.dailyVolumeUsed.toFixed(0)} / ${status.dailyVolumeLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-[#262626] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                volumePercentage > 80 ? 'bg-[#ef4444]' : 'bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8]'
              }`}
              style={{ width: `${Math.min(volumePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Safety Limits */}
        <div className="p-4 bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#38bdf8]" />
            <span className="text-sm font-semibold text-white">Active Limits</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#A3A3A3]">Max Position Size</span>
              <span className="text-white">${limits.maxPositionSizeUSD.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A3A3A3]">Max Leverage</span>
              <span className="text-white">{limits.maxLeverage}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A3A3A3]">Max Slippage</span>
              <span className="text-white">{limits.maxSlippagePercent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A3A3A3]">Circuit Breaker</span>
              <span className="text-white">{limits.circuitBreakerLossPercent}% loss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
