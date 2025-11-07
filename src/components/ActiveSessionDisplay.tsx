import { useState, useEffect } from 'react';
import { Key, Clock, Shield, XCircle, RefreshCw } from 'lucide-react';

interface ActiveSessionDisplayProps {
  walletAddress: string;
  onRevoke: () => void;
}

interface SessionData {
  id: string;
  wallet_address: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

const ActiveSessionDisplay: React.FC<ActiveSessionDisplayProps> = ({
  walletAddress,
  onRevoke,
}) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [walletAddress]);

  useEffect(() => {
    if (!session) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const expiresAt = new Date(session.expires_at).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [session]);

  const fetchSession = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/session-key/${walletAddress}`
      );

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/revoke-session-key`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      setSession(null);
      onRevoke();
    } catch (error) {
      console.error('Failed to revoke session:', error);
      alert('Failed to revoke session. Please try again.');
    } finally {
      setIsRevoking(false);
    }
  };

  if (!session || !session.is_active) {
    return null;
  }

  const isExpiringSoon = () => {
    const now = Date.now();
    const expiresAt = new Date(session.expires_at).getTime();
    const diff = expiresAt - now;
    return diff < 24 * 60 * 60 * 1000; // Less than 24 hours
  };

  return (
    <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#10b981] to-[#38bdf8] rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Active Session</h3>
            <p className="text-xs text-[#A3A3A3]">Automated trading enabled</p>
          </div>
        </div>
        <button
          onClick={handleRevoke}
          disabled={isRevoking}
          className="px-4 py-2 bg-[#171717] border border-[#ef4444]/30 text-[#ef4444] rounded-xl text-sm font-semibold hover:bg-[#ef4444]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRevoking ? (
            <>
              <div className="w-4 h-4 border-2 border-[#ef4444] border-t-transparent rounded-full animate-spin"></div>
              Revoking...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Revoke
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {/* Time Remaining */}
        <div className="flex items-center justify-between p-3 bg-[#171717] rounded-xl">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isExpiringSoon() ? 'text-[#f59e0b]' : 'text-[#38bdf8]'}`} />
            <span className="text-sm text-[#A3A3A3]">Expires</span>
          </div>
          <span className={`text-sm font-semibold ${isExpiringSoon() ? 'text-[#f59e0b]' : 'text-white'}`}>
            {timeRemaining}
          </span>
        </div>

        {/* Created At */}
        <div className="flex items-center justify-between p-3 bg-[#171717] rounded-xl">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#9E7FFF]" />
            <span className="text-sm text-[#A3A3A3]">Created</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {new Date(session.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Expiring Soon Warning */}
        {isExpiringSoon() && (
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#f59e0b] font-semibold mb-1">Session Expiring Soon</p>
                <p className="text-xs text-[#f59e0b]/80">
                  Create a new session key to continue automated trading
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSessionDisplay;
