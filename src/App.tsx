import { useState, useEffect, useCallback } from 'react';
import { WalletStrategy } from '@injectivelabs/wallet-strategy';
import { Wallet } from '@injectivelabs/wallet-base';
import { ChainId } from '@injectivelabs/ts-types';
import WalletConnect from './components/WalletConnect';
import CopyTradeForm from './components/CopyTradeForm';
import TradeHistory from './components/TradeHistory';
import { WalletService } from './services/wallet';
import { TrendingUp, Shield, Zap } from 'lucide-react';

export interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  size: number;
  leverage: number;
  timestamp: number;
  status: 'open' | 'closed';
  exitPrice?: number;
  pnl?: number;
  takeProfit?: number;
  stopLoss?: number;
}

const walletStrategy = new WalletStrategy({
  chainId: ChainId.Mainnet,
  strategies: {},
});

function App() {
  const [address, setAddress] = useState('');
  const [walletType, setWalletType] = useState<'keplr' | 'leap' | null>(null);
  const [targetAddress, setTargetAddress] = useState('');
  const [copyAmount, setCopyAmount] = useState('');
  const [isCopyTrading, setIsCopyTrading] = useState(false);
  const [trades] = useState<Trade[]>([]);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Load saved session on mount
  useEffect(() => {
    const savedSession = WalletService.loadCopyTradingSession();
    if (savedSession) {
      console.log('📦 Loaded saved session:', savedSession);
      setTargetAddress(savedSession.targetAddress);
      setCopyAmount(savedSession.copyAmount);
    }
  }, []);

  // Fetch USDT balance when wallet connects
  const fetchBalance = useCallback(async () => {
    if (!address) return;

    setIsLoadingBalance(true);
    try {
      console.log('🔍 Fetching USDT balance for:', address);
      const balance = await WalletService.getUSDTBalance(address);
      setUsdtBalance(balance);
      console.log('💰 USDT Balance:', balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setUsdtBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, fetchBalance]);

  const handleConnect = async (wallet: 'keplr' | 'leap') => {
    try {
      console.log(`🔌 Connecting to ${wallet}...`);
      
      const walletEnum = wallet === 'keplr' ? Wallet.Keplr : Wallet.Leap;
      walletStrategy.setWallet(walletEnum);

      const chainId = 'injective-1';
      const walletInstance = wallet === 'keplr' ? window.keplr : window.leap;
      
      if (!walletInstance) {
        throw new Error(`${wallet} wallet not found. Please install the extension.`);
      }

      await walletInstance.enable(chainId);
      
      const addresses = await walletStrategy.getAddresses();
      console.log('✅ Connected addresses:', addresses);

      if (addresses && addresses.length > 0) {
        setAddress(addresses[0]);
        setWalletType(wallet);
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      alert(`Failed to connect: ${error.message}`);
    }
  };

  const handleDisconnect = () => {
    setAddress('');
    setWalletType(null);
    setUsdtBalance(0);
    if (isCopyTrading) {
      handleStopCopyTrading();
    }
  };

  const handleStartCopyTrading = async (selectedAssets: string[]) => {
    if (!address || !walletType) {
      alert('Please connect your wallet first');
      return;
    }

    if (!targetAddress || !copyAmount) {
      alert('Please fill in all fields');
      return;
    }

    const amount = parseFloat(copyAmount);
    if (amount > usdtBalance) {
      alert(`Insufficient balance. You have ${usdtBalance.toFixed(2)} USDT available.`);
      return;
    }

    try {
      console.log('🚀 Starting copy trading...');
      console.log('Target:', targetAddress);
      console.log('Amount:', copyAmount);
      console.log('Assets:', selectedAssets);

      const signature = await WalletService.signCopyTradingAuthorization(
        walletType,
        address,
        targetAddress,
        copyAmount,
        selectedAssets
      );

      console.log('✅ Authorization signed:', signature);

      const session = {
        targetAddress,
        copyAmount,
        selectedAssets,
        startTime: Date.now(),
        signature,
        walletAddress: address,
      };

      WalletService.saveCopyTradingSession(session);
      setIsCopyTrading(true);

      console.log('📡 Copy trading started - monitoring target wallet...');
    } catch (error: any) {
      console.error('Failed to start copy trading:', error);
      alert(`Failed to start: ${error.message}`);
    }
  };

  const handleStopCopyTrading = () => {
    console.log('🛑 Stopping copy trading...');
    setIsCopyTrading(false);
    WalletService.clearCopyTradingSession();
  };

  return (
    <div className="min-h-screen bg-[#171717]">
      <header className="border-b border-[#2F2F2F] bg-[#171717]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">CopyTradinj</h1>
                <p className="text-xs text-[#A3A3A3]">Hyperliquid → Injective</p>
              </div>
            </div>
            <WalletConnect
              address={address}
              walletType={walletType}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#9E7FFF]/10 via-transparent to-[#38bdf8]/10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">
              Copy Trade from Hyperliquid to Injective
            </h2>
            <p className="text-xl text-[#A3A3A3] max-w-2xl mx-auto">
              Automatically mirror trades from top Hyperliquid traders directly on Injective
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="p-6 bg-[#262626] border border-[#2F2F2F] rounded-2xl">
              <div className="w-12 h-12 bg-[#9E7FFF]/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#9E7FFF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Execution</h3>
              <p className="text-sm text-[#A3A3A3]">
                Trades are executed instantly when detected on Hyperliquid
              </p>
            </div>

            <div className="p-6 bg-[#262626] border border-[#2F2F2F] rounded-2xl">
              <div className="w-12 h-12 bg-[#38bdf8]/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#38bdf8]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Non-Custodial</h3>
              <p className="text-sm text-[#A3A3A3]">
                Your funds stay in your wallet. We never have access to your private keys
              </p>
            </div>

            <div className="p-6 bg-[#262626] border border-[#2F2F2F] rounded-2xl">
              <div className="w-12 h-12 bg-[#f472b6]/10 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-[#f472b6]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Proportional Sizing</h3>
              <p className="text-sm text-[#A3A3A3]">
                Positions are automatically sized based on your allocated balance
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-8">
          <CopyTradeForm
            targetAddress={targetAddress}
            copyAmount={copyAmount}
            isCopyTrading={isCopyTrading}
            walletAddress={address}
            usdtBalance={usdtBalance}
            isLoadingBalance={isLoadingBalance}
            onTargetAddressChange={setTargetAddress}
            onCopyAmountChange={setCopyAmount}
            onStart={handleStartCopyTrading}
            onStop={handleStopCopyTrading}
            onRefreshBalance={fetchBalance}
          />

          <TradeHistory trades={trades} />
        </div>
      </section>
    </div>
  );
}

export default App;
