import { useState, useEffect } from 'react';
import { FileText, TrendingUp, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { ContractService, Position, TradeHistory } from '../services/contractService';

interface ContractInfoProps {
  contractService: ContractService | null;
  isActive: boolean;
}

const ContractInfo: React.FC<ContractInfoProps> = ({ contractService, isActive }) => {
  const [lockedBalance, setLockedBalance] = useState('0');
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadContractData = async () => {
    if (!contractService) return;

    setIsLoading(true);
    try {
      const [balance, positionsData, historyData] = await Promise.all([
        contractService.getBalance(),
        contractService.getPositions(),
        contractService.getHistory(),
      ]);

      setLockedBalance(balance.locked);
      setPositions(positionsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load contract data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contractService && isActive) {
      loadContractData();
      const interval = setInterval(loadContractData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [contractService, isActive]);

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      {/* Locked Balance Card */}
      <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Locked in Contract</h3>
              <p className="text-xs text-[#A3A3A3]">Available for trading</p>
            </div>
          </div>
          <button
            onClick={loadContractData}
            disabled={isLoading}
            className="p-2 hover:bg-[#171717] rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-[#38bdf8] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-3xl font-bold text-white">{lockedBalance} USDT</div>
      </div>

      {/* Open Positions */}
      <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#10b981] to-[#38bdf8] rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Open Positions</h3>
            <p className="text-xs text-[#A3A3A3]">{positions.length} active</p>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-8 text-[#A3A3A3]">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No open positions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position, index) => (
              <div
                key={index}
                className="p-4 bg-[#171717] border border-[#2F2F2F] rounded-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{position.symbol}</span>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        position.side === 'long'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : 'bg-[#ef4444]/20 text-[#ef4444]'
                      }`}
                    >
                      {position.side.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#A3A3A3]">{position.leverage}x</span>
                  </div>
                  <span className="text-sm text-white">{position.size}</span>
                </div>
                <div className="text-xs text-[#A3A3A3]">
                  Entry: ${parseFloat(position.entry_price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trade History */}
      <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#f472b6] to-[#9E7FFF] rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Trade History</h3>
            <p className="text-xs text-[#A3A3A3]">Recent trades</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-[#A3A3A3]">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No trade history</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((trade) => (
              <div
                key={trade.id}
                className="p-3 bg-[#171717] border border-[#2F2F2F] rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{trade.symbol}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        trade.side === 'long'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : 'bg-[#ef4444]/20 text-[#ef4444]'
                      }`}
                    >
                      {trade.side}
                    </span>
                  </div>
                  {trade.pnl && (
                    <span
                      className={`text-sm font-semibold ${
                        parseFloat(trade.pnl) >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}
                    >
                      {parseFloat(trade.pnl) >= 0 ? '+' : ''}
                      {trade.pnl} USDT
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#A3A3A3] mt-1">
                  Entry: ${parseFloat(trade.entry_price).toFixed(2)}
                  {trade.exit_price && ` → Exit: $${parseFloat(trade.exit_price).toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractInfo;
