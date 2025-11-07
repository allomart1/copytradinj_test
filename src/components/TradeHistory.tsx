import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Trade } from '../App';

interface TradeHistoryProps {
  trades: Trade[];
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPnL = (pnl: number | undefined) => {
    if (pnl === undefined) return '-';
    const formatted = formatPrice(Math.abs(pnl));
    return pnl >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-[#2F2F2F]">
        <h3 className="text-xl font-bold text-white">Trade History</h3>
        <p className="text-sm text-[#A3A3A3] mt-1">Your copied trades from Hyperliquid</p>
      </div>

      <div className="overflow-x-auto">
        {trades.length === 0 ? (
          <div className="p-12 text-center text-[#A3A3A3]">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${
                        trade.side === 'long'
                          ? 'bg-[#10b981]/10 text-[#10b981]'
                          : 'bg-[#ef4444]/10 text-[#ef4444]'
                      }`}
                    >
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
                    {formatPrice(trade.entryPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {trade.exitPrice ? formatPrice(trade.exitPrice) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        trade.pnl === undefined
                          ? 'text-[#A3A3A3]'
                          : trade.pnl >= 0
                            ? 'text-[#10b981]'
                            : 'text-[#ef4444]'
                      }`}
                    >
                      {formatPnL(trade.pnl)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${
                        trade.status === 'open'
                          ? 'bg-[#38bdf8]/10 text-[#38bdf8]'
                          : 'bg-[#A3A3A3]/10 text-[#A3A3A3]'
                      }`}
                    >
                      {trade.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A3A3A3]">
                    {formatDate(trade.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TradeHistory;
