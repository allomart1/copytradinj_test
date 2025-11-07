import { TrendingUp, TrendingDown, RefreshCw, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Position {
  id: string;
  asset: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  leverage: number;
  liquidationPrice: number;
}

interface PositionsPanelProps {
  walletAddress: string;
}

export default function PositionsPanel({ walletAddress }: PositionsPanelProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://copytradinj.blockval.io';

  const fetchPositions = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching positions for:', walletAddress);
      const response = await fetch(`${API_BASE_URL}/api/positions/${walletAddress}`);

      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }

      const data = await response.json();
      console.log('✅ Positions loaded:', data);
      setPositions(data.positions || []);
    } catch (err: any) {
      console.error('❌ Failed to fetch positions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    // Refresh positions every 10 seconds
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const handleClosePosition = async (positionId: string) => {
    try {
      console.log('🔒 Closing position:', positionId);
      const response = await fetch(`${API_BASE_URL}/api/positions/${positionId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to close position');
      }

      console.log('✅ Position closed');
      // Refresh positions after closing
      await fetchPositions();
    } catch (err: any) {
      console.error('❌ Failed to close position:', err);
      alert(`Failed to close position: ${err.message}`);
    }
  };

  if (isLoading && positions.length === 0) {
    return (
      <div className="bg-[#262626] rounded-2xl border border-[#2F2F2F] p-8">
        <div className="flex items-center justify-center gap-3 text-[#A3A3A3]">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading positions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#262626] rounded-2xl border border-[#2F2F2F] p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#ef4444]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-[#ef4444]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load Positions</h3>
          <p className="text-[#A3A3A3] mb-4">{error}</p>
          <button
            onClick={fetchPositions}
            className="px-6 py-3 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-[#262626] rounded-2xl border border-[#2F2F2F] p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#9E7FFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-[#9E7FFF]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Open Positions</h3>
          <p className="text-[#A3A3A3]">
            Your copied positions will appear here once trades are executed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Open Positions</h2>
        <button
          onClick={fetchPositions}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#262626] border border-[#2F2F2F] rounded-xl text-[#A3A3A3] hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {positions.map((position) => (
          <div
            key={position.id}
            className="bg-[#262626] rounded-2xl border border-[#2F2F2F] p-6 hover:border-[#9E7FFF]/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  position.side === 'long' 
                    ? 'bg-[#10b981]/10 text-[#10b981]' 
                    : 'bg-[#ef4444]/10 text-[#ef4444]'
                }`}>
                  {position.side === 'long' ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{position.asset}</h3>
                  <p className="text-sm text-[#A3A3A3]">
                    {position.side.toUpperCase()} • {position.leverage}x Leverage
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleClosePosition(position.id)}
                className="px-4 py-2 bg-[#ef4444]/10 text-[#ef4444] rounded-xl hover:bg-[#ef4444]/20 transition-colors font-semibold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#A3A3A3] mb-1">Size</p>
                <p className="text-lg font-bold text-white">{position.size.toFixed(4)}</p>
              </div>

              <div>
                <p className="text-xs text-[#A3A3A3] mb-1">Entry Price</p>
                <p className="text-lg font-bold text-white">${position.entryPrice.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-xs text-[#A3A3A3] mb-1">Current Price</p>
                <p className="text-lg font-bold text-white">${position.currentPrice.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-xs text-[#A3A3A3] mb-1">PnL</p>
                <p className={`text-lg font-bold ${
                  position.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}>
                  {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} USDT
                  <span className="text-sm ml-2">
                    ({position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#2F2F2F]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A3A3A3]">Liquidation Price</span>
                <span className="text-[#ef4444] font-semibold">
                  ${position.liquidationPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
