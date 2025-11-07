import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';
import { WalletStrategy } from '@injectivelabs/wallet-strategy';
import { MsgBroadcaster } from '@injectivelabs/wallet-core';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';

interface PendingTrade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: string;
  entry_price: string;
  leverage: number;
  market_id: string;
  order_params: {
    price: string;
    quantity: string;
    margin: string;
  };
  created_at: string;
  expires_at: string;
}

interface PendingTradeApprovalProps {
  walletAddress: string;
  walletStrategy: WalletStrategy;
}

const PendingTradeApproval: React.FC<PendingTradeApprovalProps> = ({
  walletAddress,
  walletStrategy,
}) => {
  const [pendingTrades, setPendingTrades] = useState<PendingTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Poll for pending trades
  useEffect(() => {
    const fetchPendingTrades = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/pending-trades/${walletAddress}`
        );
        const data = await response.json();
        setPendingTrades(data.pendingTrades || []);
      } catch (err) {
        console.error('Failed to fetch pending trades:', err);
      }
    };

    fetchPendingTrades();
    const interval = setInterval(fetchPendingTrades, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [walletAddress]);

  const approveTrade = async (trade: PendingTrade) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Requesting wallet signature for trade:', trade);

      // Create the message broadcaster
      const msgBroadcaster = new MsgBroadcaster({
        walletStrategy,
        network: Network.Mainnet,
        endpoints: getNetworkEndpoints(Network.Mainnet),
        simulateTx: true,
      });

      // Build the trade message
      const { MsgCreateDerivativeMarketOrder } = await import('@injectivelabs/sdk-ts');
      
      const msg = MsgCreateDerivativeMarketOrder.fromJSON({
        marketId: trade.market_id,
        injectiveAddress: walletAddress,
        orderType: trade.side === 'long' ? 1 : 2, // 1 = Buy, 2 = Sell
        price: trade.order_params.price,
        quantity: trade.order_params.quantity,
        margin: trade.order_params.margin,
        triggerPrice: '0',
      });

      console.log('📤 Broadcasting transaction...');

      // Broadcast the transaction (user will be prompted to sign)
      const result = await msgBroadcaster.broadcast({
        msgs: [msg],
        injectiveAddress: walletAddress,
      });

      console.log('✅ Transaction signed and broadcast!');
      console.log('📋 TX Hash:', result.txHash);

      // Notify backend that trade was approved
      const approveResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/approve-trade`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tradeId: trade.id,
            txHash: result.txHash,
            walletAddress,
          }),
        }
      );

      if (!approveResponse.ok) {
        throw new Error('Failed to confirm trade approval');
      }

      // Remove from pending list
      setPendingTrades(prev => prev.filter(t => t.id !== trade.id));

      console.log('✅ Trade approved and executed successfully!');
    } catch (err: any) {
      console.error('❌ Failed to approve trade:', err);
      setError(err.message || 'Failed to approve trade');
    } finally {
      setIsLoading(false);
    }
  };

  const rejectTrade = async (tradeId: string) => {
    try {
      // TODO: Implement reject endpoint
      setPendingTrades(prev => prev.filter(t => t.id !== tradeId));
    } catch (err) {
      console.error('Failed to reject trade:', err);
    }
  };

  if (pendingTrades.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <div className="bg-[#262626] border border-[#2F2F2F] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8]">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 animate-pulse" />
            <h3 className="font-bold">Trade Approval Required</h3>
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {pendingTrades.map((trade) => (
            <div
              key={trade.id}
              className="p-4 bg-[#171717] border border-[#2F2F2F] rounded-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {trade.symbol}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        trade.side === 'long'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : 'bg-[#ef4444]/20 text-[#ef4444]'
                      }`}
                    >
                      {trade.side.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-[#A3A3A3] mt-1">
                    {trade.leverage}x Leverage
                  </div>
                </div>
                <button
                  onClick={() => rejectTrade(trade.id)}
                  className="text-[#A3A3A3] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <div className="text-[#A3A3A3]">Size</div>
                  <div className="text-white font-semibold">{trade.size}</div>
                </div>
                <div>
                  <div className="text-[#A3A3A3]">Entry Price</div>
                  <div className="text-white font-semibold">
                    ${parseFloat(trade.entry_price).toFixed(2)}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-3 p-2 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg">
                  <div className="flex items-start gap-2 text-xs text-[#ef4444]">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => approveTrade(trade)}
                disabled={isLoading}
                className="w-full py-2 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9E7FFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Execute
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PendingTradeApproval;
