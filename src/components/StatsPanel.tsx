import React from 'react';
import { TrendingUp, Target, DollarSign, Activity } from 'lucide-react';

interface StatsPanelProps {
  stats: {
    totalTrades: number;
    successRate: number;
    totalPnL: number;
    activePositions: number;
  };
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Trades',
      value: stats.totalTrades,
      icon: Activity,
      color: 'text-[#9E7FFF]',
      bgColor: 'bg-[#9E7FFF]/10',
      borderColor: 'border-[#9E7FFF]/20',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: Target,
      color: 'text-[#10b981]',
      bgColor: 'bg-[#10b981]/10',
      borderColor: 'border-[#10b981]/20',
    },
    {
      label: 'Total P&L',
      value: `$${stats.totalPnL.toLocaleString()}`,
      icon: DollarSign,
      color: stats.totalPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]',
      bgColor: stats.totalPnL >= 0 ? 'bg-[#10b981]/10' : 'bg-[#ef4444]/10',
      borderColor: stats.totalPnL >= 0 ? 'border-[#10b981]/20' : 'border-[#ef4444]/20',
    },
    {
      label: 'Active Positions',
      value: stats.activePositions,
      icon: TrendingUp,
      color: 'text-[#38bdf8]',
      bgColor: 'bg-[#38bdf8]/10',
      borderColor: 'border-[#38bdf8]/20',
    },
  ];

  return (
    <div className="mt-6 bg-[#262626] border border-[#2F2F2F] rounded-3xl p-6 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-4">Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} border ${item.borderColor} rounded-2xl p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs text-[#A3A3A3]">{item.label}</span>
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;
