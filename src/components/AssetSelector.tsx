import { useState, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

// Common tradeable assets between Hyperliquid and Injective
// Based on perpetual futures markets available on both platforms
export const COMMON_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'major' },
  { symbol: 'ETH', name: 'Ethereum', category: 'major' },
  { symbol: 'SOL', name: 'Solana', category: 'major' },
  { symbol: 'ARB', name: 'Arbitrum', category: 'layer2' },
  { symbol: 'ATOM', name: 'Cosmos', category: 'cosmos' },
  { symbol: 'INJ', name: 'Injective', category: 'cosmos' },
  { symbol: 'TIA', name: 'Celestia', category: 'cosmos' },
  { symbol: 'AVAX', name: 'Avalanche', category: 'layer1' },
  { symbol: 'MATIC', name: 'Polygon', category: 'layer2' },
  { symbol: 'OP', name: 'Optimism', category: 'layer2' },
  { symbol: 'SUI', name: 'Sui', category: 'layer1' },
  { symbol: 'APT', name: 'Aptos', category: 'layer1' },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'meme' },
  { symbol: 'SHIB', name: 'Shiba Inu', category: 'meme' },
  { symbol: 'PEPE', name: 'Pepe', category: 'meme' },
  { symbol: 'WIF', name: 'Dogwifhat', category: 'meme' },
  { symbol: 'BONK', name: 'Bonk', category: 'meme' },
];

export const ASSET_PRESETS = {
  all: {
    name: 'All Assets',
    description: 'Copy all available trades',
    assets: COMMON_ASSETS.map(a => a.symbol),
  },
  majors: {
    name: 'Major Pairs',
    description: 'BTC, ETH, SOL only',
    assets: ['BTC', 'ETH', 'SOL'],
  },
  layer1: {
    name: 'Layer 1s',
    description: 'Major blockchain platforms',
    assets: COMMON_ASSETS.filter(a => a.category === 'layer1' || a.category === 'major').map(a => a.symbol),
  },
  cosmos: {
    name: 'Cosmos Ecosystem',
    description: 'ATOM, INJ, TIA',
    assets: COMMON_ASSETS.filter(a => a.category === 'cosmos').map(a => a.symbol),
  },
  memes: {
    name: 'Meme Coins',
    description: 'DOGE, SHIB, PEPE, WIF, BONK',
    assets: COMMON_ASSETS.filter(a => a.category === 'meme').map(a => a.symbol),
  },
};

interface AssetSelectorProps {
  selectedAssets: string[];
  onAssetsChange: (assets: string[]) => void;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({ selectedAssets, onAssetsChange }) => {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Check which preset is active based on selected assets
  useEffect(() => {
    const checkActivePreset = () => {
      for (const [key, preset] of Object.entries(ASSET_PRESETS)) {
        const presetAssets = preset.assets.sort();
        const currentAssets = [...selectedAssets].sort();
        
        if (JSON.stringify(presetAssets) === JSON.stringify(currentAssets)) {
          setActivePreset(key);
          return;
        }
      }
      setActivePreset(null);
    };

    checkActivePreset();
  }, [selectedAssets]);

  const handlePresetClick = (presetKey: string) => {
    const preset = ASSET_PRESETS[presetKey as keyof typeof ASSET_PRESETS];
    onAssetsChange(preset.assets);
  };

  const handleAssetToggle = (symbol: string) => {
    if (selectedAssets.includes(symbol)) {
      onAssetsChange(selectedAssets.filter(s => s !== symbol));
    } else {
      onAssetsChange([...selectedAssets, symbol]);
    }
  };

  const isAssetSelected = (symbol: string) => selectedAssets.includes(symbol);

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Quick Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(ASSET_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetClick(key)}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                activePreset === key
                  ? 'border-[#9E7FFF] bg-[#9E7FFF]/10 shadow-lg shadow-[#9E7FFF]/20'
                  : 'border-[#2F2F2F] bg-[#262626] hover:border-[#9E7FFF]/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-white text-sm">{preset.name}</h4>
                {activePreset === key && (
                  <CheckCircle2 className="w-5 h-5 text-[#9E7FFF] flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-[#A3A3A3]">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Assets */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Individual Assets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COMMON_ASSETS.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => handleAssetToggle(asset.symbol)}
              className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                isAssetSelected(asset.symbol)
                  ? 'border-[#38bdf8] bg-[#38bdf8]/10'
                  : 'border-[#2F2F2F] bg-[#262626] hover:border-[#38bdf8]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {isAssetSelected(asset.symbol) ? (
                  <CheckCircle2 className="w-5 h-5 text-[#38bdf8] flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#A3A3A3] flex-shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">{asset.symbol}</div>
                  <div className="text-xs text-[#A3A3A3]">{asset.name}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      <div className="p-4 bg-[#262626] border border-[#2F2F2F] rounded-2xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#A3A3A3]">Selected Assets:</span>
          <span className="text-sm font-semibold text-white">
            {selectedAssets.length} / {COMMON_ASSETS.length}
          </span>
        </div>
        {selectedAssets.length === 0 && (
          <p className="text-xs text-[#f59e0b] mt-2">⚠️ Please select at least one asset to copy trade</p>
        )}
      </div>
    </div>
  );
};

export default AssetSelector;
