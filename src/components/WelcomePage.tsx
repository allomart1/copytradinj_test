import { useState } from 'react';
import { Copy, TrendingUp, Shield, Zap, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface WelcomePageProps {
  onEnterApp: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onEnterApp }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleEnterApp = () => {
    setShowDisclaimer(true);
  };

  const handleAcceptDisclaimer = () => {
    console.log('Accept button clicked!', { acknowledged });
    
    if (acknowledged) {
      console.log('Saving to localStorage and calling onEnterApp');
      localStorage.setItem('hyperliquid_disclaimer_accepted', 'true');
      onEnterApp();
    } else {
      console.log('Checkbox not acknowledged');
    }
  };

  const features = [
    {
      icon: Copy,
      title: 'Automated Copy Trading',
      description: 'Mirror trades from successful Hyperliquid wallets directly to your Injective account',
      color: 'from-[#9E7FFF] to-[#38bdf8]'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Monitoring',
      description: 'Track positions, P&L, and trade execution in real-time with live WebSocket updates',
      color: 'from-[#38bdf8] to-[#10b981]'
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Automatic position sizing and leverage adjustment to match your account balance',
      color: 'from-[#f472b6] to-[#9E7FFF]'
    },
    {
      icon: Zap,
      title: 'Instant Execution',
      description: 'Lightning-fast trade replication with minimal latency for optimal entry prices',
      color: 'from-[#10b981] to-[#38bdf8]'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#171717] via-[#1a1a1a] to-[#171717] relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#9E7FFF] opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#38bdf8] opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#f472b6] opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="relative z-20 border-b border-[#2F2F2F] bg-[#171717]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-xl flex items-center justify-center shadow-lg shadow-[#9E7FFF]/20">
                <Copy className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Hyperliquid Copy Trader</span>
            </div>
            
            <button
              onClick={handleEnterApp}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#9E7FFF]/30 transition-all duration-300 hover:scale-105"
            >
              Enter App
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-3xl mb-8 shadow-2xl shadow-[#9E7FFF]/30 animate-float">
            <Copy className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-[#9E7FFF] via-[#38bdf8] to-[#f472b6] bg-clip-text text-transparent">
            Hyperliquid Copy Trader
          </h1>
          
          <p className="text-xl text-[#A3A3A3] max-w-3xl mx-auto leading-relaxed">
            Automatically mirror successful trading strategies from Hyperliquid to Injective. 
            Follow top traders, replicate their positions, and manage risk—all in real-time.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-[#262626] border border-[#2F2F2F] rounded-3xl hover:border-[#9E7FFF]/50 transition-all duration-500 hover:shadow-xl hover:shadow-[#9E7FFF]/10 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-[#A3A3A3] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl p-10 mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">1</div>
              <h4 className="text-lg font-semibold text-white mb-2">Connect Wallet</h4>
              <p className="text-sm text-[#A3A3A3]">Link your Injective wallet using Keplr or Leap</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#38bdf8] to-[#10b981] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">2</div>
              <h4 className="text-lg font-semibold text-white mb-2">Set Target Wallet</h4>
              <p className="text-sm text-[#A3A3A3]">Enter the Hyperliquid wallet address you want to copy</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#10b981] to-[#f472b6] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">3</div>
              <h4 className="text-lg font-semibold text-white mb-2">Start Trading</h4>
              <p className="text-sm text-[#A3A3A3]">Trades are automatically mirrored to your account</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center animate-fade-in">
          <button
            onClick={handleEnterApp}
            className="group relative px-12 py-5 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white text-lg font-bold rounded-2xl hover:shadow-2xl hover:shadow-[#9E7FFF]/40 transition-all duration-300 hover:scale-105 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Enter App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#38bdf8] to-[#9E7FFF] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>

      {/* Safety Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="bg-[#262626] border border-[#2F2F2F] rounded-3xl max-w-2xl w-full p-8 shadow-2xl animate-scale-in">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#f59e0b] to-[#ef4444] rounded-full flex items-center justify-center shadow-lg shadow-[#f59e0b]/30">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Important Safety Notice
            </h2>

            {/* Warning Message */}
            <div className="bg-[#171717] border border-[#2F2F2F] rounded-2xl p-6 mb-6">
              <div className="space-y-4 text-[#A3A3A3]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Test Phase Application</p>
                    <p className="text-sm">This application is currently in active testing and development. Features may be unstable or incomplete.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Use Fresh Wallets Only</p>
                    <p className="text-sm">Create a new wallet specifically for testing this application. Never use your main wallet or wallets containing significant funds.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Low Quantities Only</p>
                    <p className="text-sm">Only use small amounts that you can afford to lose completely. This is experimental software and losses may occur.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">No Guarantees</p>
                    <p className="text-sm">There are no guarantees of profit or protection from loss. Copy trading carries significant risk, especially during the testing phase.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acknowledgment Checkbox */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => {
                    console.log('Checkbox changed:', e.target.checked);
                    setAcknowledged(e.target.checked);
                  }}
                  className="sr-only"
                />
                <div 
                  onClick={() => {
                    console.log('Checkbox div clicked, current state:', acknowledged);
                    setAcknowledged(!acknowledged);
                  }}
                  className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    acknowledged 
                      ? 'bg-gradient-to-br from-[#9E7FFF] to-[#38bdf8] border-[#9E7FFF]' 
                      : 'border-[#2F2F2F] bg-[#171717]'
                  }`}
                >
                  {acknowledged && (
                    <CheckCircle2 className="w-5 h-5 text-white absolute top-0.5 left-0.5" />
                  )}
                </div>
              </div>
              <span className="text-sm text-[#A3A3A3] group-hover:text-white transition-colors">
                I understand and acknowledge the risks. I will only use a fresh wallet with small amounts for testing purposes.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  console.log('Go Back clicked');
                  setShowDisclaimer(false);
                  setAcknowledged(false);
                }}
                className="flex-1 px-6 py-4 bg-[#171717] border border-[#2F2F2F] text-white rounded-2xl font-semibold hover:bg-[#2F2F2F] transition-all duration-300"
              >
                Go Back
              </button>
              <button
                onClick={handleAcceptDisclaimer}
                disabled={!acknowledged}
                className={`flex-1 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  acknowledged
                    ? 'bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white hover:shadow-lg hover:shadow-[#9E7FFF]/30 hover:scale-105 cursor-pointer'
                    : 'bg-[#2F2F2F] text-[#A3A3A3] cursor-not-allowed'
                }`}
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
