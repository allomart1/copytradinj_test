import { IndexerGrpcAccountPortfolioApi } from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';

const USDT_DENOM = 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7';

interface CopyTradingSession {
  targetAddress: string;
  copyAmount: string;
  selectedAssets: string[];
  startTime: number;
  signature: string;
  walletAddress: string;
}

export class WalletService {
  static async getUSDTBalance(address: string): Promise<number> {
    try {
      console.log('🔍 Fetching USDT balance for address:', address);

      const endpoints = getNetworkEndpoints(Network.Mainnet);
      const portfolioApi = new IndexerGrpcAccountPortfolioApi(endpoints.indexer);

      console.log('📡 Using indexer endpoint:', endpoints.indexer);

      const portfolio = await portfolioApi.fetchAccountPortfolio(address);

      console.log('📊 Portfolio response:', JSON.stringify(portfolio, null, 2));

      const usdtBalance = portfolio.bankBalancesList.find(
        (balance) => balance.denom === USDT_DENOM
      );

      if (!usdtBalance) {
        console.log('⚠️ No USDT balance found');
        return 0;
      }

      const balance = parseFloat(usdtBalance.amount) / 1e6;
      console.log('💰 USDT Balance:', balance);

      return balance;
    } catch (error) {
      console.error('❌ Failed to fetch USDT balance:', error);
      throw error;
    }
  }

  static async signCopyTradingAuthorization(
    walletType: 'keplr' | 'leap',
    walletAddress: string,
    targetAddress: string,
    copyAmount: string,
    selectedAssets: string[]
  ): Promise<string> {
    try {
      const message = JSON.stringify({
        action: 'authorize_copy_trading',
        targetAddress,
        copyAmount,
        selectedAssets,
        timestamp: Date.now(),
      });

      const walletInstance = walletType === 'keplr' ? window.keplr : window.leap;

      if (!walletInstance) {
        throw new Error(`${walletType} wallet not found`);
      }

      const chainId = 'injective-1';

      const signature = await walletInstance.signArbitrary(
        chainId,
        walletAddress,
        message
      );

      console.log('✅ Message signed:', signature);

      return signature.signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  static saveCopyTradingSession(session: CopyTradingSession): void {
    try {
      localStorage.setItem('copyTradingSession', JSON.stringify(session));
      console.log('💾 Session saved to localStorage');
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  static loadCopyTradingSession(): CopyTradingSession | null {
    try {
      const sessionData = localStorage.getItem('copyTradingSession');
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      console.log('📦 Session loaded from localStorage:', session);
      return session;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  static clearCopyTradingSession(): void {
    try {
      localStorage.removeItem('copyTradingSession');
      console.log('🗑️ Session cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
}
