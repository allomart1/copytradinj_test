import { Wallet, LogOut } from 'lucide-react';

interface WalletConnectProps {
  address: string;
  walletType: 'keplr' | 'leap' | null;
  onConnect: (wallet: 'keplr' | 'leap') => void;
  onDisconnect: () => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  address,
  walletType,
  onConnect,
  onDisconnect,
}) => {
  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-[#262626] border border-[#2F2F2F] rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
            <span className="text-sm text-white font-medium">
              {address.slice(0, 8)}...{address.slice(-6)}
            </span>
            <span className="text-xs text-[#A3A3A3] ml-2">
              ({walletType === 'keplr' ? 'Keplr' : 'Leap'})
            </span>
          </div>
        </div>
        <button
          onClick={onDisconnect}
          className="p-2 hover:bg-[#262626] rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5 text-[#A3A3A3]" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onConnect('keplr')}
        className="px-6 py-2 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9E7FFF]/30 transition-all flex items-center gap-2"
      >
        <Wallet className="w-5 h-5" />
        Connect Keplr
      </button>
      <button
        onClick={() => onConnect('leap')}
        className="px-6 py-2 bg-[#262626] border border-[#2F2F2F] text-white rounded-xl font-semibold hover:border-[#9E7FFF] transition-all flex items-center gap-2"
      >
        <Wallet className="w-5 h-5" />
        Connect Leap
      </button>
    </div>
  );
};

export default WalletConnect;
