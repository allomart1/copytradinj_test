/**
 * Smart Contract Service
 * Handles all interactions with the CosmWasm copy trading contract
 */

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';

export interface ContractConfig {
  owner: string;
  target_wallet: string;
  locked_amount: string;
  selected_assets: string[];
  max_leverage: number;
  is_active: boolean;
}

export interface Position {
  symbol: string;
  side: string;
  size: string;
  entry_price: string;
  leverage: number;
  timestamp: number;
}

export interface TradeHistory {
  id: number;
  symbol: string;
  side: string;
  size: string;
  entry_price: string;
  exit_price?: string;
  pnl?: string;
  timestamp: number;
}

export class ContractService {
  private client: SigningCosmWasmClient | null = null;
  private contractAddress: string;
  private rpcEndpoint: string;

  constructor(contractAddress: string, rpcEndpoint: string = 'https://sentry.tm.injective.network:443') {
    this.contractAddress = contractAddress;
    this.rpcEndpoint = rpcEndpoint;
  }

  /**
   * Initialize the signing client with wallet
   */
  async initialize(offlineSigner: any): Promise<void> {
    this.client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      offlineSigner,
      {
        gasPrice: GasPrice.fromString('500000000inj'),
      }
    );
  }

  /**
   * Lock USDT funds in the contract
   */
  async lockFunds(senderAddress: string, amount: string): Promise<string> {
    if (!this.client) throw new Error('Client not initialized');

    const usdtDenom = 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const amountInMicroUsdt = (parseFloat(amount) * 1_000_000).toString();

    const result = await this.client.execute(
      senderAddress,
      this.contractAddress,
      { lock_funds: {} },
      'auto',
      undefined,
      [{ denom: usdtDenom, amount: amountInMicroUsdt }]
    );

    return result.transactionHash;
  }

  /**
   * Stop copy trading
   */
  async stopCopyTrading(senderAddress: string): Promise<string> {
    if (!this.client) throw new Error('Client not initialized');

    const result = await this.client.execute(
      senderAddress,
      this.contractAddress,
      { stop_copy_trading: {} },
      'auto'
    );

    return result.transactionHash;
  }

  /**
   * Withdraw funds from contract
   */
  async withdraw(senderAddress: string, amount: string): Promise<string> {
    if (!this.client) throw new Error('Client not initialized');

    const amountInMicroUsdt = (parseFloat(amount) * 1_000_000).toString();

    const result = await this.client.execute(
      senderAddress,
      this.contractAddress,
      { withdraw: { amount: amountInMicroUsdt } },
      'auto'
    );

    return result.transactionHash;
  }

  /**
   * Update contract configuration
   */
  async updateConfig(
    senderAddress: string,
    targetWallet?: string,
    selectedAssets?: string[],
    maxLeverage?: number
  ): Promise<string> {
    if (!this.client) throw new Error('Client not initialized');

    const result = await this.client.execute(
      senderAddress,
      this.contractAddress,
      {
        update_config: {
          target_wallet: targetWallet,
          selected_assets: selectedAssets,
          max_leverage: maxLeverage,
        },
      },
      'auto'
    );

    return result.transactionHash;
  }

  /**
   * Query contract configuration
   */
  async getConfig(): Promise<ContractConfig> {
    if (!this.client) throw new Error('Client not initialized');

    const result = await this.client.queryContractSmart(this.contractAddress, {
      get_config: {},
    });

    return result;
  }

  /**
   * Query locked balance
   */
  async getBalance(): Promise<{ locked: string; available: string }> {
    if (!this.client) throw new Error('Client not initialized');

    const result = await this.client.queryContractSmart(this.contractAddress, {
      get_balance: {},
    });

    return {
      locked: (parseInt(result.locked) / 1_000_000).toString(),
      available: (parseInt(result.available) / 1_000_000).toString(),
    };
  }

  /**
   * Query all open positions
   */
  async getPositions(): Promise<Position[]> {
    if (!this.client) throw new Error('Client not initialized');

    const result = await this.client.queryContractSmart(this.contractAddress, {
      get_positions: {},
    });

    return result.positions || [];
  }

  /**
   * Query trade history
   */
  async getHistory(startAfter?: number, limit?: number): Promise<TradeHistory[]> {
    if (!this.client) throw new Error('Client not initialized');

    const result = await this.client.queryContractSmart(this.contractAddress, {
      get_history: {
        start_after: startAfter,
        limit: limit || 10,
      },
    });

    return result.trades || [];
  }
}
