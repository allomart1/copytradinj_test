/**
 * Injective Trading Service
 * Handles trade execution on Injective using the SDK
 */

import { WalletStrategy } from '@injectivelabs/wallet-strategy';
import { MsgBroadcaster } from '@injectivelabs/wallet-core';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import {
  MsgCreateDerivativeLimitOrder,
  MsgCreateDerivativeMarketOrder,
  MsgBatchUpdateOrders,
  DerivativeOrderSide,
  OrderType,
} from '@injectivelabs/sdk-ts';
import { BigNumberInBase } from '@injectivelabs/utils';
import { Trade } from '../App';

export class InjectiveTrader {
  private walletStrategy: WalletStrategy;
  private msgBroadcaster: MsgBroadcaster;
  private injectiveAddress: string;
  private network = Network.Mainnet;
  private endpoints = getNetworkEndpoints(Network.Mainnet);

  constructor(walletStrategy: WalletStrategy, injectiveAddress: string) {
    this.walletStrategy = walletStrategy;
    this.injectiveAddress = injectiveAddress;

    this.msgBroadcaster = new MsgBroadcaster({
      walletStrategy,
      simulateTx: true,
      network: this.network,
      endpoints: this.endpoints,
      gasBufferCoefficient: 1.2,
    });
  }

  /**
   * Get USDT balance for the connected wallet
   */
  async getUSDTBalance(): Promise<number> {
    try {
      // Query bank balance for USDT
      const response = await fetch(
        `${this.endpoints.rest}/cosmos/bank/v1beta1/balances/${this.injectiveAddress}`
      );
      const data = await response.json();

      // Find USDT balance (peggy0x...)
      const usdtDenom = 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT on Injective
      const usdtBalance = data.balances?.find((b: any) => b.denom === usdtDenom);

      if (usdtBalance) {
        return parseFloat(usdtBalance.amount) / 1e6; // USDT has 6 decimals
      }

      return 0;
    } catch (error) {
      console.error('Failed to fetch USDT balance:', error);
      return 0;
    }
  }

  /**
   * Execute a trade on Injective
   */
  async executeTrade(trade: Trade): Promise<void> {
    try {
      // Get market ID for the symbol
      const marketId = await this.getMarketId(trade.symbol);
      if (!marketId) {
        throw new Error(`Market not found for symbol: ${trade.symbol}`);
      }

      // Calculate order parameters
      const price = new BigNumberInBase(trade.entryPrice);
      const quantity = new BigNumberInBase(trade.size);
      const margin = quantity.times(price).dividedBy(trade.leverage);

      // Create market order message
      const msg = MsgCreateDerivativeMarketOrder.fromJSON({
        marketId,
        injectiveAddress: this.injectiveAddress,
        orderType: trade.side === 'long' ? DerivativeOrderSide.Buy : DerivativeOrderSide.Sell,
        price: price.toFixed(),
        quantity: quantity.toFixed(),
        margin: margin.toFixed(),
        triggerPrice: '0',
      });

      // Broadcast transaction
      const result = await this.msgBroadcaster.broadcast({
        msgs: [msg],
        injectiveAddress: this.injectiveAddress,
      });

      console.log('Trade executed:', result);

      // If TP/SL are set, create limit orders
      if (trade.takeProfit || trade.stopLoss) {
        await this.setTPSL(marketId, trade);
      }
    } catch (error) {
      console.error('Failed to execute trade:', error);
      throw error;
    }
  }

  /**
   * Set Take Profit and Stop Loss orders
   */
  private async setTPSL(marketId: string, trade: Trade): Promise<void> {
    try {
      const msgs = [];
      const quantity = new BigNumberInBase(trade.size);

      // Take Profit order
      if (trade.takeProfit) {
        const tpPrice = new BigNumberInBase(trade.takeProfit);
        const tpMsg = MsgCreateDerivativeLimitOrder.fromJSON({
          marketId,
          injectiveAddress: this.injectiveAddress,
          orderType: trade.side === 'long' ? DerivativeOrderSide.Sell : DerivativeOrderSide.Buy,
          price: tpPrice.toFixed(),
          quantity: quantity.toFixed(),
          margin: '0',
          triggerPrice: '0',
        });
        msgs.push(tpMsg);
      }

      // Stop Loss order
      if (trade.stopLoss) {
        const slPrice = new BigNumberInBase(trade.stopLoss);
        const slMsg = MsgCreateDerivativeLimitOrder.fromJSON({
          marketId,
          injectiveAddress: this.injectiveAddress,
          orderType: trade.side === 'long' ? DerivativeOrderSide.Sell : DerivativeOrderSide.Buy,
          price: slPrice.toFixed(),
          quantity: quantity.toFixed(),
          margin: '0',
          triggerPrice: slPrice.toFixed(),
        });
        msgs.push(slMsg);
      }

      if (msgs.length > 0) {
        await this.msgBroadcaster.broadcast({
          msgs,
          injectiveAddress: this.injectiveAddress,
        });
      }
    } catch (error) {
      console.error('Failed to set TP/SL:', error);
    }
  }

  /**
   * Close a position
   */
  async closePosition(trade: Trade): Promise<number> {
    try {
      const marketId = await this.getMarketId(trade.symbol);
      if (!marketId) {
        throw new Error(`Market not found for symbol: ${trade.symbol}`);
      }

      // Get current position to calculate PnL
      const position = await this.getPosition(marketId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Create opposite market order to close
      const quantity = new BigNumberInBase(Math.abs(position.quantity));
      const msg = MsgCreateDerivativeMarketOrder.fromJSON({
        marketId,
        injectiveAddress: this.injectiveAddress,
        orderType: trade.side === 'long' ? DerivativeOrderSide.Sell : DerivativeOrderSide.Buy,
        price: '0', // Market order
        quantity: quantity.toFixed(),
        margin: '0',
        triggerPrice: '0',
      });

      await this.msgBroadcaster.broadcast({
        msgs: [msg],
        injectiveAddress: this.injectiveAddress,
      });

      // Calculate PnL
      const pnl = position.unrealizedPnl;
      console.log('Position closed with PnL:', pnl);

      return pnl;
    } catch (error) {
      console.error('Failed to close position:', error);
      throw error;
    }
  }

  /**
   * Get market ID for a symbol
   */
  private async getMarketId(symbol: string): Promise<string | null> {
    try {
      // Query derivative markets
      const response = await fetch(
        `${this.endpoints.indexer}/api/explorer/v1/derivative_markets`
      );
      const data = await response.json();

      // Find market by ticker
      const market = data.markets?.find((m: any) => 
        m.ticker?.includes(symbol) || m.baseDenom?.includes(symbol)
      );

      return market?.marketId || null;
    } catch (error) {
      console.error('Failed to get market ID:', error);
      return null;
    }
  }

  /**
   * Get current position for a market
   */
  private async getPosition(marketId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.endpoints.indexer}/api/explorer/v1/derivative_positions/${this.injectiveAddress}`
      );
      const data = await response.json();

      return data.positions?.find((p: any) => p.marketId === marketId);
    } catch (error) {
      console.error('Failed to get position:', error);
      return null;
    }
  }
}
