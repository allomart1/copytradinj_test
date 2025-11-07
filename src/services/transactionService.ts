import { MsgBroadcaster } from '@injectivelabs/wallet-core';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { ChainId } from '@injectivelabs/ts-types';
import { 
  MsgCreateDerivativeMarketOrder,
  MsgCreateDerivativeLimitOrder,
  getGasPriceBasedOnMessage,
} from '@injectivelabs/sdk-ts';
import { BigNumberInBase } from '@injectivelabs/utils';

// Default gas limit for Injective transactions
const DEFAULT_GAS_LIMIT = 200000;

export interface GasEstimate {
  gasLimit: number;
  gasFee: string;
  gasFeeInINJ: string;
  totalCostUSD: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: number;
}

export class TransactionService {
  private network = Network.Mainnet;
  private endpoints = getNetworkEndpoints(Network.Mainnet);
  private chainId = ChainId.Mainnet;

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(msg: any): Promise<GasEstimate> {
    try {
      // Get base gas price
      const gasPrice = getGasPriceBasedOnMessage(msg);
      
      // Estimate gas limit (use default + 20% buffer)
      const gasLimit = Math.ceil(DEFAULT_GAS_LIMIT * 1.2);
      
      // Calculate gas fee
      const gasFee = new BigNumberInBase(gasLimit)
        .times(gasPrice)
        .toFixed();
      
      // Convert to INJ (18 decimals)
      const gasFeeInINJ = new BigNumberInBase(gasFee)
        .dividedBy(1e18)
        .toFixed(6);
      
      // Estimate USD cost (assuming INJ = $20, update with real price)
      const injPriceUSD = await this.getINJPrice();
      const totalCostUSD = new BigNumberInBase(gasFeeInINJ)
        .times(injPriceUSD)
        .toFixed(2);

      return {
        gasLimit,
        gasFee,
        gasFeeInINJ,
        totalCostUSD,
      };
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      // Return conservative estimate
      return {
        gasLimit: DEFAULT_GAS_LIMIT,
        gasFee: '0',
        gasFeeInINJ: '0.001',
        totalCostUSD: '0.02',
      };
    }
  }

  /**
   * Get current INJ price in USD
   */
  private async getINJPrice(): Promise<number> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol&vs_currencies=usd'
      );
      const data = await response.json();
      return data['injective-protocol']?.usd || 20; // Fallback to $20
    } catch (error) {
      console.error('Failed to fetch INJ price:', error);
      return 20; // Fallback price
    }
  }

  /**
   * Sign and broadcast transaction using wallet
   */
  async signAndBroadcast(
    walletAddress: string,
    msg: any,
    walletType: 'keplr' | 'leap'
  ): Promise<TransactionResult> {
    try {
      const wallet = walletType === 'keplr' ? window.keplr : window.leap;
      
      if (!wallet) {
        throw new Error(`${walletType} wallet not found`);
      }

      // Get offline signer
      const offlineSigner = wallet.getOfflineSigner('injective-1');
      
      // Create broadcaster
      const broadcaster = new MsgBroadcaster({
        network: this.network,
        endpoints: this.endpoints,
        chainId: this.chainId,
      });

      // Estimate gas first
      const gasEstimate = await this.estimateGas(msg);

      // Sign and broadcast
      const txResponse = await broadcaster.broadcast({
        msgs: [msg],
        injectiveAddress: walletAddress,
        gasLimit: gasEstimate.gasLimit,
      });

      if (txResponse.code !== 0) {
        throw new Error(txResponse.rawLog || 'Transaction failed');
      }

      return {
        success: true,
        txHash: txResponse.txHash,
        gasUsed: txResponse.gasUsed,
      };
    } catch (error: any) {
      console.error('Transaction failed:', error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Parse error messages into user-friendly format
   */
  private parseError(error: any): string {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    // Common error patterns
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds. Please ensure you have enough INJ for gas fees and USDT for the trade.';
    }
    
    if (errorMessage.includes('account sequence mismatch')) {
      return 'Transaction sequence error. Please try again.';
    }
    
    if (errorMessage.includes('out of gas')) {
      return 'Transaction ran out of gas. Please try again with higher gas limit.';
    }
    
    if (errorMessage.includes('rejected')) {
      return 'Transaction rejected by user.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'Transaction timed out. Please check your connection and try again.';
    }

    if (errorMessage.includes('market not found')) {
      return 'Trading pair not available on Injective. Please select a different asset.';
    }

    // Return original message if no pattern matches
    return errorMessage.length > 100 
      ? errorMessage.substring(0, 100) + '...' 
      : errorMessage;
  }

  /**
   * Retry transaction with exponential backoff
   */
  async retryTransaction(
    walletAddress: string,
    msg: any,
    walletType: 'keplr' | 'leap',
    maxRetries = 3
  ): Promise<TransactionResult> {
    let lastError: string = '';
    
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.signAndBroadcast(walletAddress, msg, walletType);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      // Don't retry if user rejected
      if (lastError.includes('rejected')) {
        return result;
      }
      
      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    
    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError}`,
    };
  }

  /**
   * Validate transaction before signing
   */
  async validateTransaction(
    walletAddress: string,
    msg: any,
    usdtBalance: number
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if user has INJ for gas
      const injBalance = await this.getINJBalance(walletAddress);
      const gasEstimate = await this.estimateGas(msg);
      const requiredINJ = parseFloat(gasEstimate.gasFeeInINJ);

      if (injBalance < requiredINJ) {
        return {
          valid: false,
          error: `Insufficient INJ for gas. Required: ${requiredINJ.toFixed(4)} INJ, Available: ${injBalance.toFixed(4)} INJ`,
        };
      }

      // Check if user has enough USDT for trade
      if (msg.margin) {
        const requiredUSDT = parseFloat(msg.margin) / 1e6; // Convert from base units
        if (usdtBalance < requiredUSDT) {
          return {
            valid: false,
            error: `Insufficient USDT. Required: ${requiredUSDT.toFixed(2)} USDT, Available: ${usdtBalance.toFixed(2)} USDT`,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate transaction. Please try again.',
      };
    }
  }

  /**
   * Get INJ balance
   */
  private async getINJBalance(walletAddress: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.endpoints.rest}/cosmos/bank/v1beta1/balances/${walletAddress}`
      );
      const data = await response.json();

      const injBalance = data.balances?.find((b: any) => b.denom === 'inj');
      return injBalance ? parseFloat(injBalance.amount) / 1e18 : 0;
    } catch (error) {
      console.error('Failed to fetch INJ balance:', error);
      return 0;
    }
  }
}

export const transactionService = new TransactionService();
