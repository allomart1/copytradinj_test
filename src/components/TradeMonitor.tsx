import React from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, Target, Shield } from 'lucide-react';
import { Trade } from '../App';

interface TradeMonitorProps {
  trades: Trade[];
  isCopyTrading: boolean;
  targetAddress: string;
}

const TradeMonitor: React.FC<TradeMonitorProps> = ({
  trades,
  isCopyTrading,
  targetAddress,
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#2F2F2F]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#9E7FFF]/20 to-[#38bdf8]/20 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#9E7FFF]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trade Monitor</h2>
              <p className="text-sm text-[#A3A3A3]">Real-time trade replication</p>
            </div>
          </div>
          
          {isCopyTrading && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl">
              <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-[#10b981]">Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!isCopyTrading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-[#171717] rounded-2xl flex items-center justify-center mb-4 border border-[#2F2F2F]">
              <Activity className="w-10 h-10 text-[#A3A3A3]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Active Copy Trading</h3>
            <p className="text-[#A3A3A3] max-w-md">
              Configure your copy trading settings and start monitoring to see trades appear here
            </p>
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#9E7FFF]/20 to-[#38bdf8]/20 rounded-2xl flex items-center justify-center mb-4 border border-[#2F2F2F]">
              <Clock className="w-10 h-10 text-[#9E7FFF] animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Monitoring Active</h3>
            <p className="text-[#A3A3A3] max-w-md mb-4">
              Watching for new trades from target wallet
            </p>
            <p className="text-xs text-[#A3A3A3] font-mono bg-[#171717] px-4 py-2 rounded-lg border border-[#2F2F2F]">
              {targetAddress.slice(0, 20)}...{targetAddress.slice(-10)}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="bg-[#171717] border border-[#2F2F2F] rounded-2xl p-5 hover:border-[#9E7FFF]/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      trade.side === 'long' 
                        ? 'bg-[#10b981]/10 border border-[#10b981]/20' 
                        : 'bg-[#ef4444]/10 border border-[#ef4444]/20'
                    }`}>
                      {trade.side === 'long' ? (
                        <TrendingUp className="w-5 h-5 text-[#10b981]" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-[#ef4444]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{trade.symbol}</h4>
                      <p className="text-sm text-[#A3A3A3]">{formatTime(trade.timestamp)}</p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    trade.status === 'open'
                      ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20'
                      : 'bg-[#A3A3A3]/10 text-[#A3A3A3] border border-[#A3A3A3]/20'
                  }`}>
                    {trade.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-[#A3A3A3] mb-1">Side</p>
                    <p className={`text-sm font-semibold ${
                      trade.side === 'long' ? 'text-[#10b981]' : 'text-[#ef4444]'
                    }`}>
                      {trade.side.toUpperCase()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-[#A3A3A3] mb-1">Size</p>
                    <p className="text-sm font-semibold text-white">{trade.size.toFixed(4)}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-[#A3A3A3] mb-1">Entry Price</p>
                    <p className="text-sm font-semibold text-white">{formatPrice(trade.entryPrice)}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-[#A3A3A3] mb-1">Leverage</p>
                    <p className="text-sm font-semibold text-white">{trade.leverage}x</p>
                  </div>
                </div>

                {(trade.takeProfit || trade.stopLoss) && (
                  <div className="mt-4 pt-4 border-t border-[#2F2F2F] grid grid-cols-2 gap-4">
                    {trade.takeProfit && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#10b981]" />
                        <div>
                          <p className="text-xs text-[#A3A3A3]">Take Profit</p>
                          <p className="text-sm font-semibold text-[#10b981]">{formatPrice(trade.takeProfit)}</p>
                        </div>
                      </div>
                    )}
                    
                    {trade.stopLoss && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#ef4444]" />
                        <div>
                          <p className="text-xs text-[#A3A3A3]">Stop Loss</p>
                          <p className="text-sm font-semibold text-[#ef4444]">{formatPrice(trade.stopLoss)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {trade.pnl !== undefined && (
                  <div className="mt-4 pt-4 border-t border-[#2F2F2F]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#A3A3A3]">P&L</span>
                      <span className={`text-lg font-bold ${
                        trade.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatPrice(trade.pnl)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeMonitor;
