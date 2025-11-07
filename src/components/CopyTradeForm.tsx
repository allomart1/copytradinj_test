import { useState } from 'react';
import { Settings, TrendingUp, Shield, Zap, RefreshCw } from 'lucide-react';

interface CopyTradeFormProps {
  targetAddress: string;
  copyAmount: string;
  isCopyTrading: boolean;
  walletAddress: string;
  usdtBalance: number;
  isLoadingBalance: boolean;
  onTargetAddressChange: (address: string) => void;
  onCopyAmountChange: (amount: string) => void;
  onStart: (selectedAssets: string[]) => void;
  onStop: () => void;
  onRefreshBalance: () => void;
}

const CopyTradeForm: React.FC<CopyTradeFormProps> = ({
  targetAddress,
  copyAmount,
  isCopyTrading,
  walletAddress,
  usdtBalance,
  isLoadingBalance,
  onTargetAddressChange,
  onCopyAmountChange,
  onStart,
  onStop,
  onRefreshBalance,
}) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const availableAssets = ['BTC', 'ETH', 'SOL', 'ATOM', 'INJ'];

  const toggleAsset = (asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  const handleStart = () => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset to copy');
      return;
    }
    onStart(selectedAssets);
  };

  return (
    <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Copy Trading Setup</h2>
          <p className="text-[#A3A3A3]">Configure your copy trading parameters</p>
        </div>
      </div>

      {!walletAddress ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-[#A3A3A3] opacity-50" />
          <p className="text-[#A3A3A3] mb-2">Connect your wallet to start</p>
          <p className="text-sm text-[#A3A3A3]">Use Keplr or Leap wallet to continue</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* USDT Balance */}
          <div className="bg-[#171717] border border-[#2F2F2F] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A3A3A3] mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-white">
                  {isLoadingBalance ? (
                    <span className="inline-block w-6 h-6 border-2 border-[#9E7FFF] border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    `${usdtBalance.toFixed(2)} USDT`
                  )}
                </p>
              </div>
              <button
                onClick={onRefreshBalance}
                disabled={isLoadingBalance}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-[#A3A3A3] ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Target Wallet */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Target Hyperliquid Wallet
            </label>
            <input
              type="text"
              value={targetAddress}
              onChange={(e) => onTargetAddressChange(e.target.value)}
              placeholder="0x..."
              disabled={isCopyTrading}
              className="w-full px-4 py-3 bg-[#171717] border border-[#2F2F2F] rounded-xl text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#9E7FFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-[#A3A3A3] mt-2">
              Enter the Hyperliquid wallet address you want to copy trades from
            </p>
          </div>

          {/* Copy Amount */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Copy Amount (USDT)
            </label>
            <input
              type="number"
              value={copyAmount}
              onChange={(e) => onCopyAmountChange(e.target.value)}
              placeholder="30"
              disabled={isCopyTrading}
              className="w-full px-4 py-3 bg-[#171717] border border-[#2F2F2F] rounded-xl text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#9E7FFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-[#A3A3A3] mt-2">
              Amount to allocate for copy trading (proportional sizing will be applied)
            </p>
          </div>

          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Select Assets to Copy
            </label>
            <div className="grid grid-cols-3 gap-3">
              {availableAssets.map((asset) => (
                <button
                  key={asset}
                  onClick={() => toggleAsset(asset)}
                  disabled={isCopyTrading}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedAssets.includes(asset)
                      ? 'bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white shadow-lg shadow-[#9E7FFF]/30'
                      : 'bg-[#171717] border border-[#2F2F2F] text-[#A3A3A3] hover:border-[#9E7FFF]'
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#A3A3A3] mt-2">
              Only trades for selected assets will be copied
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-[#171717] border border-[#2F2F2F] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-[#10b981]" />
                <span className="text-sm font-semibold text-white">Auto-Execute</span>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                Trades execute automatically when detected
              </p>
            </div>

            <div className="bg-[#171717] border border-[#2F2F2F] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#38bdf8]" />
                <span className="text-sm font-semibold text-white">Risk Control</span>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                Proportional sizing based on your amount
              </p>
            </div>
          </div>

          {/* Action Button */}
          {!isCopyTrading ? (
            <button
              onClick={handleStart}
              disabled={!targetAddress || !copyAmount || selectedAssets.length === 0}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9E7FFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Copy Trading
            </button>
          ) : (
            <button
              onClick={onStop}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#ef4444] to-[#f59e0b] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ef4444]/30 transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Stop Copy Trading
            </button>
          )}

          {isCopyTrading && (
            <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-[#10b981]">Copy Trading Active</span>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                Monitoring {targetAddress.slice(0, 6)}...{targetAddress.slice(-4)} for new trades
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CopyTradeForm;
