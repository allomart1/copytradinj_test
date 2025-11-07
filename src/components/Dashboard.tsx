import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  side: string;
  size: number;
  entry_price: number;
  exit_price: number | null;
  leverage: number;
  pnl: number | null;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface DashboardProps {
  walletAddress: string;
}

const Dashboard: React.FC<DashboardProps> = ({ walletAddress }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrades: 0,
    activeTrades: 0,
    totalPnL: 0,
    winRate: 0,
  });

  useEffect(() => {
    if (walletAddress) {
      fetchTrades();
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchTrades, 10000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  const fetchTrades = async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/${walletAddress}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }

      const data = await response.json();
      setTrades(data.trades || []);
      calculateStats(data.trades || []);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (tradesList: Trade[]) => {
    const totalTrades = tradesList.length;
    const activeTrades = tradesList.filter(t => t.status === 'open').length;
    const closedTrades = tradesList.filter(t => t.status === 'closed');
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 
      ? (winningTrades / closedTrades.length) * 100 
      : 0;

    setStats({
      totalTrades,
      activeTrades,
      totalPnL,
      winRate,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPnL = (pnl: number | null) => {
    if (pnl === null) return '-';
    const formatted = formatPrice(Math.abs(pnl));
    return pnl >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!walletAddress) {
    return (
      <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-8">
        <div className="text-center text-[#A3A3A3]">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Connect your wallet to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#262626] border border-[#2F2F2F] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#A3A3A3]">Total Trades</p>
              <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#262626] border border-[#2F2F2F] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#38bdf8] to-[#10b981] rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#A3A3A3]">Active</p>
              <p className="text-2xl font-bold text-white">{stats.activeTrades}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#262626] border border-[#2F2F2F] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              stats.totalPnL >= 0 
                ? 'bg-gradient-to-br from-[#10b981] to-[#38bdf8]' 
                : 'bg-gradient-to-br from-[#ef4444] to-[#f59e0b]'
            }`}>
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#A3A3A3]">Total P&L</p>
              <p className={`text-2xl font-bold ${
                stats.totalPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}>
                {formatPnL(stats.totalPnL)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#262626] border border-[#2F2F2F] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#f472b6] to-[#9E7FFF] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#A3A3A3]">Win Rate</p>
              <p className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-[#2F2F2F]">
          <h3 className="text-xl font-bold text-white">Trade History</h3>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#9E7FFF] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#A3A3A3] mt-4">Loading trades...</p>
            </div>
          ) : trades.length === 0 ? (
            <div className="p-12 text-center text-[#A3A3A3]">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No trades yet</p>
              <p className="text-sm mt-2">Start copy trading to see your trades here</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#171717]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                    Side
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                    Exit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2F2F2F]">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-[#171717] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-white">{trade.symbol}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${
                        trade.side === 'long'
                          ? 'bg-[#10b981]/10 text-[#10b981]'
                          : 'bg-[#ef4444]/10 text-[#ef4444]'
                      }`}>
                        {trade.side === 'long' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {trade.size} <span className="text-[#A3A3A3]">({trade.leverage}x)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {formatPrice(trade.entry_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {trade.exit_price ? formatPrice(trade.exit_price) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${
                        trade.pnl === null 
                          ? 'text-[#A3A3A3]' 
                          : trade.pnl >= 0 
                            ? 'text-[#10b981]' 
                            : 'text-[#ef4444]'
                      }`}>
                        {formatPnL(trade.pnl)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${
                        trade.status === 'open'
                          ? 'bg-[#38bdf8]/10 text-[#38bdf8]'
                          : trade.status === 'closed'
                            ? 'bg-[#A3A3A3]/10 text-[#A3A3A3]'
                            : 'bg-[#ef4444]/10 text-[#ef4444]'
                      }`}>
                        {trade.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A3A3A3]">
                      {formatDate(trade.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
