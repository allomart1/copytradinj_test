import { useState } from 'react';
import { WalletStrategy } from '@injectivelabs/wallet-strategy';
import { Key, Clock, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface SessionKeySetupProps {
  walletAddress: string;
  walletStrategy: WalletStrategy;
  onSessionCreated: (sessionData: any) => void;
}

const SessionKeySetup: React.FC<SessionKeySetupProps> = ({
  walletAddress,
  walletStrategy,
  onSessionCreated,
}) => {
  const [selectedExpiration, setSelectedExpiration] = useState<string>('7d');
  const [customDays, setCustomDays] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');

  const expirationOptions = [
    { value: '24h', label: '24 Hours', description: 'Short-term trading' },
    { value: '7d', label: '7 Days', description: 'Recommended' },
    { value: '30d', label: '30 Days', description: 'Long-term trading' },
    { value: 'custom', label: 'Custom', description: 'Set your own duration' },
  ];

  const getExpirationTimestamp = () => {
    const now = Date.now();
    
    switch (selectedExpiration) {
      case '24h':
        return now + 24 * 60 * 60 * 1000;
      case '7d':
        return now + 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return now + 30 * 24 * 60 * 60 * 1000;
      case 'custom':
        const days = parseInt(customDays);
        if (isNaN(days) || days < 1 || days > 365) {
          throw new Error('Custom days must be between 1 and 365');
        }
        return now + days * 24 * 60 * 60 * 1000;
      default:
        return now + 7 * 24 * 60 * 60 * 1000;
    }
  };

  const handleCreateSessionKey = async () => {
    setError('');
    setIsCreating(true);

    try {
      // Get expiration timestamp
      const expiresAt = getExpirationTimestamp();
      const expiresAtDate = new Date(expiresAt);

      console.log('🔑 Creating session key with expiration:', expiresAtDate.toISOString());

      // Create session key message
      const sessionKeyMessage = {
        walletAddress,
        expiresAt: expiresAtDate.toISOString(),
        permissions: ['derivative_trading'],
        timestamp: Date.now(),
      };

      // Sign the session key creation message
      const signature = await walletStrategy.signEip712TypedData(
        JSON.stringify(sessionKeyMessage),
        walletAddress
      );

      console.log('✅ Session key signed:', signature);

      // Send to backend to create and store session key
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-session-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          expiresAt: expiresAtDate.toISOString(),
          signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session key');
      }

      const data = await response.json();
      console.log('✅ Session key created:', data);

      onSessionCreated(data);
    } catch (error) {
      console.error('❌ Failed to create session key:', error);
      setError(error instanceof Error ? error.message : 'Failed to create session key');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-xl flex items-center justify-center">
          <Key className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Create Session Key</h2>
          <p className="text-[#A3A3A3]">Enable automated trade execution</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#171717] border border-[#2F2F2F] rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#38bdf8] mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">What is a Session Key?</h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              A session key allows CopyTradinj to execute trades on your behalf automatically, 
              without requiring manual approval for each trade. You maintain full custody of your 
              funds and can revoke access anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Expiration Selection */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-semibold text-white">
          Session Expiration
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          {expirationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedExpiration(option.value)}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedExpiration === option.value
                  ? 'bg-gradient-to-br from-[#9E7FFF]/20 to-[#38bdf8]/20 border-[#9E7FFF]'
                  : 'bg-[#171717] border-[#2F2F2F] hover:border-[#9E7FFF]/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-[#9E7FFF]" />
                <span className="font-semibold text-white text-sm">{option.label}</span>
              </div>
              <p className="text-xs text-[#A3A3A3]">{option.description}</p>
            </button>
          ))}
        </div>

        {/* Custom Days Input */}
        {selectedExpiration === 'custom' && (
          <div className="mt-3">
            <input
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="Enter number of days (1-365)"
              min="1"
              max="365"
              className="w-full px-4 py-3 bg-[#171717] border border-[#2F2F2F] rounded-xl text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#9E7FFF] transition-colors"
            />
          </div>
        )}
      </div>

      {/* Security Features */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-white">Security Features</h3>
        <div className="space-y-2">
          {[
            'Limited to derivative trading only',
            'Automatic expiration after selected duration',
            'Revocable anytime from dashboard',
            'Encrypted storage in secure database',
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10b981] flex-shrink-0" />
              <span className="text-xs text-[#A3A3A3]">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#ef4444] mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-[#ef4444] mb-1">Error</h3>
              <p className="text-xs text-[#ef4444]/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreateSessionKey}
        disabled={isCreating || (selectedExpiration === 'custom' && !customDays)}
        className="w-full px-6 py-4 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9E7FFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isCreating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Creating Session Key...
          </>
        ) : (
          <>
            <Key className="w-5 h-5" />
            Create Session Key
          </>
        )}
      </button>
    </div>
  );
};

export default SessionKeySetup;
