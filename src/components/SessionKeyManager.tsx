import { useState } from 'react';
import { X, Key, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { SessionKeyService } from '../services/sessionKey';

interface SessionKeyManagerProps {
  walletAddress: string;
  walletType: 'keplr' | 'leap' | null;
  onClose: () => void;
  onSessionKeyCreated: () => void;
}

type ExpirationOption = '24h' | '7d' | '30d' | 'custom';

export default function SessionKeyManager({
  walletAddress,
  walletType,
  onClose,
  onSessionKeyCreated,
}: SessionKeyManagerProps) {
  const [selectedExpiration, setSelectedExpiration] = useState<ExpirationOption>('7d');
  const [customDays, setCustomDays] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const expirationOptions = [
    { value: '24h' as ExpirationOption, label: '24 Hours', days: 1 },
    { value: '7d' as ExpirationOption, label: '7 Days', days: 7 },
    { value: '30d' as ExpirationOption, label: '30 Days', days: 30 },
    { value: 'custom' as ExpirationOption, label: 'Custom', days: 0 },
  ];

  const getExpirationDays = (): number => {
    if (selectedExpiration === 'custom') {
      return parseInt(customDays) || 7;
    }
    return expirationOptions.find(opt => opt.value === selectedExpiration)?.days || 7;
  };

  const handleCreateSessionKey = async () => {
    if (!walletType) {
      setError('Please connect your wallet first');
      return;
    }

    if (selectedExpiration === 'custom' && (!customDays || parseInt(customDays) < 1)) {
      setError('Please enter a valid number of days');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const expirationDays = getExpirationDays();
      
      console.log('🔑 Creating session key...');
      console.log('Wallet:', walletAddress);
      console.log('Expiration:', expirationDays, 'days');

      await SessionKeyService.createSessionKey(
        walletAddress,
        walletType,
        expirationDays
      );

      console.log('✅ Session key created successfully');
      setSuccess(true);
      
      setTimeout(() => {
        onSessionKeyCreated();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create session key:', err);
      setError(err.message || 'Failed to create session key');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] border border-[#2F2F2F] rounded-2xl max-w-md w-full p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[#2F2F2F] rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-[#A3A3A3]" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-[#9E7FFF]/10 rounded-xl flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-[#9E7FFF]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Create Session Key</h2>
          <p className="text-sm text-[#A3A3A3]">
            Generate a temporary key for automated trade execution
          </p>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#10b981]" />
            </div>
            <p className="text-lg font-semibold text-white mb-2">Session Key Created!</p>
            <p className="text-sm text-[#A3A3A3]">
              You can now start copy trading
            </p>
          </div>
        ) : (
          <>
            {/* Warning */}
            <div className="mb-6 p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#f59e0b] mb-1">Important</p>
                  <p className="text-xs text-[#A3A3A3]">
                    This key will be encrypted and stored securely. It allows automated trade execution without requiring your approval for each trade.
                  </p>
                </div>
              </div>
            </div>

            {/* Expiration Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Key Expiration
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {expirationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedExpiration(option.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedExpiration === option.value
                        ? 'bg-[#9E7FFF] text-white'
                        : 'bg-[#171717] text-[#A3A3A3] hover:bg-[#2F2F2F]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedExpiration === 'custom' && (
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Enter days (1-365)"
                  min="1"
                  max="365"
                  className="w-full px-4 py-3 bg-[#171717] border border-[#2F2F2F] rounded-xl text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#9E7FFF] transition-colors"
                />
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl">
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isCreating}
                className="flex-1 px-4 py-3 bg-[#171717] hover:bg-[#2F2F2F] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSessionKey}
                disabled={isCreating || (selectedExpiration === 'custom' && !customDays)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] hover:from-[#8b6fe6] hover:to-[#2da5d9] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
