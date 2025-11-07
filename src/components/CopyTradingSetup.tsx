import { useState } from 'react';
import { WalletStrategy } from '@injectivelabs/wallet-strategy';
import { Settings, TrendingUp, Shield, Zap } from 'lucide-react';

interface CopyTradingSetupProps {
  walletAddress: string;
  walletStrategy: WalletStrategy;
  onStart: () => void;
}

const CopyTradingSetup: React.FC<CopyTradingSetupProps> = ({
  walletAddress,
  walletStrategy,
  onStart,
}) => {
  const [targetWallet, setTargetWallet] = useState('0xA8Ca67475463613c838656B5C1a6Cc377EadC336');
  const [copyAmount, setCopyAmount] = useState('30');
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const [isLoading, setIsLoading] = useState(false);

  const availableAssets = ['BTC', 'ETH', 'SOL', 'ATOM', 'INJ'];

  const toggleAsset = (asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset)
        ? prev.filter((a) => a !== asset)
        : [...prev, asset]
    );
  };

  const handleStartCopyTrading = async () => {
    if (!targetWallet || !copyAmount || selectedAssets.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Sign a message to authorize copy trading
      const message = `Authorize CopyTradinj to copy trades from ${targetWallet} with amount ${copyAmount} USDT`;
      
      // Get signature from wallet
      const signature = await walletStrategy.signEip712TypedData(message, walletAddress);

      // Send configuration to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/start-copy-trading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          targetWallet,
          amount: copyAmount,
          selectedAssets,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start copy trading');
      }

      const data = await response.json();
      console.log('✅ Copy trading started:', data);

      onStart();
    } catch (error) {
      console.error('Failed to start copy trading:', error);
      alert('Failed to start copy trading. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
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

        <div className="space-y-6">
          {/* Target Wallet */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Target Hyperliquid Wallet
            </label>
            <input
              type="text"
              value={targetWallet}
              onChange={(e) => setTargetWallet(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-[#171717] border border-[#2F2F2F] rounded-xl text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#9E7FFF] transition-colors"
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
              onChange={(e) => setCopyAmount(e.target.value)}
              placeholder="30"
              className="w-full px-4 py-3 bg-[#171717] border border-[#2F2F2F] rounded-xl text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#9E7FFF] transition-colors"
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
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
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

          {/* Start Button */}
          <button
            onClick={handleStartCopyTrading}
            disabled={isLoading || !targetWallet || !copyAmount || selectedAssets.length === 0}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9E7FFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Starting...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Start Copy Trading
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyTradingSetup;
