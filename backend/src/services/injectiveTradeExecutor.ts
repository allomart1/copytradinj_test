import { MsgBroadcaster } from '@injectivelabs/wallet-core';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { ChainId } from '@injectivelabs/ts-types';
import {
  MsgCreateDerivativeMarketOrder,
  derivativeMarginToChainMarginToFixed,
  derivativePriceToChainPriceToFixed,
  derivativeQuantityToChainQuantityToFixed,
  IndexerGrpcDerivativesApi,
  DerivativeMarket,
} from '@injectivelabs/sdk-ts';
import { BigNumberInBase } from '@injectivelabs/utils';
import { HyperliquidTrade } from './hyperliquidMonitor.js';
import { sessionKeyService } from './sessionKeyService.js';

const NETWORK = Network.Testnet;
const ENDPOINTS = getNetworkEndpoints(NETWORK);

export class InjectiveTradeExecutor {
  private walletAddress: string;
  private copyAmount: number;
  private selectedAssets: string[];
  private derivativeApi: IndexerGrpcDerivativesApi;

  constructor(walletAddress: string, copyAmount: number, selectedAssets: string[]) {
    this.walletAddress = walletAddress;
    this.copyAmount = copyAmount;
    this.selectedAssets = selectedAssets;
    this.derivativeApi = new IndexerGrpcDerivativesApi(ENDPOINTS.indexer);
  }

  private async getMarketId(symbol: string): Promise<string> {
    console.log(`🔍 Looking up market ID for ${symbol}...`);

    try {
      // fetchMarkets() returns the array directly, not wrapped in an object
      const markets = await this.derivativeApi.fetchMarkets();
      console.log(`📊 Found ${markets.length} derivative markets`);

      const normalizedSymbol = symbol.replace('-', '/').toUpperCase();
      console.log(`🔎 Searching for: ${normalizedSymbol}`);

      // Use SDK's DerivativeMarket type (which includes PerpetualMarket)
      const market = markets.find((m) => {
        const marketTicker = m.ticker.toUpperCase();
        return (
          marketTicker === normalizedSymbol ||
          marketTicker === `${normalizedSymbol} PERP` ||
          marketTicker.startsWith(normalizedSymbol)
        );
      });

      if (!market) {
        console.error(`❌ Market not found for ${symbol}`);
        console.log('Available markets:', markets.map((m) => m.ticker).join(', '));
        throw new Error(`Market not found for ${symbol}`);
      }

      console.log(`✅ Found market: ${market.ticker} (${market.marketId})`);
      return market.marketId;
    } catch (error) {
      console.error(`❌ Error fetching markets:`, error);
      throw error;
    }
  }

  private calculateProportionalSize(
    targetSize: number,
    targetAmount: number
  ): number {
    const ratio = this.copyAmount / targetAmount;
    const proportionalSize = targetSize * ratio;

    console.log('📊 Proportional sizing:', {
      targetSize,
      targetAmount,
      copyAmount: this.copyAmount,
      ratio,
      proportionalSize,
    });

    return proportionalSize;
  }

  async executeTrade(trade: HyperliquidTrade): Promise<any> {
    console.log('⚡ Executing trade on Injective:', trade);

    // Check if asset is in selected list
    const baseAsset = trade.symbol.split('-')[0];
    if (!this.selectedAssets.includes(baseAsset)) {
      console.log(`⏭️ Skipping ${baseAsset} - not in selected assets`);
      return { success: false, reason: 'Asset not selected' };
    }

    try {
      // Get session key
      console.log('🔑 Fetching session key...');
      const sessionPrivateKey = await sessionKeyService.getDecryptedPrivateKey(
        this.walletAddress
      );

      if (!sessionPrivateKey) {
        console.error('❌ No active session key found');
        return { success: false, error: 'No active session key' };
      }

      console.log('✅ Session key retrieved');

      // Get market ID
      const marketId = await this.getMarketId(trade.symbol);

      // Calculate proportional size
      const proportionalSize = this.calculateProportionalSize(
        trade.size,
        this.copyAmount
      );

      // Prepare order message
      const orderType = trade.side === 'long' ? 1 : 2; // 1 = BUY, 2 = SELL

      // Get default subaccount ID (first subaccount)
      const subaccountId = `${this.walletAddress}000000000000000000000000`;

      const msg = MsgCreateDerivativeMarketOrder.fromJSON({
        marketId,
        injectiveAddress: this.walletAddress,
        subaccountId,
        feeRecipient: this.walletAddress,
        orderType,
        price: derivativePriceToChainPriceToFixed({
          value: trade.entryPrice,
        }),
        quantity: derivativeQuantityToChainQuantityToFixed({
          value: proportionalSize,
        }),
        margin: derivativeMarginToChainMarginToFixed({
          value: new BigNumberInBase(this.copyAmount).toWei(),
        }),
        triggerPrice: '0',
      });

      console.log('📝 Order message prepared:', {
        marketId,
        subaccountId,
        orderType: trade.side,
        price: trade.entryPrice,
        quantity: proportionalSize,
        margin: this.copyAmount,
      });

      // Broadcast transaction using session key
      const msgBroadcaster = new MsgBroadcaster({
        walletStrategy: {
          getAddresses: async () => [this.walletAddress],
          signTransaction: async (transaction: any) => {
            // Sign with session private key
            return sessionPrivateKey.sign(Buffer.from(transaction));
          },
        } as any,
        network: NETWORK,
        endpoints: ENDPOINTS,
        simulateTx: true,
      });

      console.log('📡 Broadcasting transaction...');

      const result = await msgBroadcaster.broadcast({
        msgs: msg,
        injectiveAddress: this.walletAddress,
      });

      console.log('✅ Transaction broadcast result:', result);

      return {
        success: true,
        txHash: result.txHash,
        marketId,
        size: proportionalSize,
      };
    } catch (error) {
      console.error('❌ Failed to execute trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
