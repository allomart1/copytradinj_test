import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import {
  MsgCreateDerivativeLimitOrder,
  MsgCreateDerivativeMarketOrder,
  MsgCancelDerivativeOrder,
  getInjectiveAddress,
  IndexerGrpcDerivativesApi,
  IndexerGrpcAccountApi,
} from '@injectivelabs/sdk-ts';
import { BigNumberInBase } from '@injectivelabs/utils';

// Order side enum - using string literals instead of enum
enum OrderSide {
  Buy = 'buy',
  Sell = 'sell',
}

export interface TradeParams {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  leverage: number;
  entryPrice?: number; // Optional for market orders
  takeProfit?: number;
  stopLoss?: number;
}

export interface Position {
  marketId: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  leverage: number;
  unrealizedPnl: number;
  margin: number;
}

export class InjectiveTrader {
  private network = Network.Mainnet;
  private endpoints = getNetworkEndpoints(Network.Mainnet);
  private indexerDerivativesApi: IndexerGrpcDerivativesApi;
  private indexerAccountApi: IndexerGrpcAccountApi;
  private walletAddress: string;

  constructor(walletAddress: string) {
    this.walletAddress = walletAddress;
    this.indexerDerivativesApi = new IndexerGrpcDerivativesApi(this.endpoints.indexer);
    this.indexerAccountApi = new IndexerGrpcAccountApi(this.endpoints.indexer);
  }

  /**
   * Get market ID for a symbol (e.g., BTC → BTC/USDT PERP market)
   */
  private async getMarketId(symbol: string): Promise<string | null> {
    try {
      const markets = await this.indexerDerivativesApi.fetchMarkets();
      
      // Find perpetual market for the symbol
      const market = markets.find(m => 
        m.ticker.includes(symbol) && 
        m.ticker.includes('PERP') &&
        m.quoteDenom.includes('USDT')
      );

      return market?.marketId || null;
    } catch (error) {
      console.error('Failed to get market ID:', error);
      return null;
    }
  }

  /**
   * Execute a market order
   */
  async executeMarketOrder(params: TradeParams): Promise<string> {
    const marketId = await this.getMarketId(params.symbol);
    if (!marketId) {
      throw new Error(`Market not found for ${params.symbol}`);
    }

    // Calculate position size and margin
    const quantity = new BigNumberInBase(params.size);
    const price = params.entryPrice ? new BigNumberInBase(params.entryPrice) : new BigNumberInBase(0);
    const notional = quantity.times(price.gt(0) ? price : 1);
    const margin = notional.dividedBy(params.leverage);

    const msg = MsgCreateDerivativeMarketOrder.fromJSON({
      marketId,
      injectiveAddress: this.walletAddress,
      orderType: params.side === 'long' ? OrderSide.Buy : OrderSide.Sell,
      price: '0', // Market order
      quantity: quantity.toFixed(),
      margin: margin.toFixed(),
      triggerPrice: '0',
    });

    // Return the message - caller will broadcast it
    return JSON.stringify(msg.toData());
  }

  /**
   * Execute a limit order
   */
  async executeLimitOrder(params: TradeParams): Promise<string> {
    if (!params.entryPrice) {
      throw new Error('Entry price required for limit orders');
    }

    const marketId = await this.getMarketId(params.symbol);
    if (!marketId) {
      throw new Error(`Market not found for ${params.symbol}`);
    }

    const quantity = new BigNumberInBase(params.size);
    const price = new BigNumberInBase(params.entryPrice);
    const notional = quantity.times(price);
    const margin = notional.dividedBy(params.leverage);

    const msg = MsgCreateDerivativeLimitOrder.fromJSON({
      marketId,
      injectiveAddress: this.walletAddress,
      orderType: params.side === 'long' ? OrderSide.Buy : OrderSide.Sell,
      price: price.toFixed(),
      quantity: quantity.toFixed(),
      margin: margin.toFixed(),
      triggerPrice: '0',
    });

    return JSON.stringify(msg.toData());
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string): Promise<string> {
    const marketId = await this.getMarketId(symbol);
    if (!marketId) {
      throw new Error(`Market not found for ${symbol}`);
    }

    // Get current position
    const position = await this.getPosition(marketId);
    if (!position) {
      throw new Error('No open position found');
    }

    // Create opposite market order
    const quantity = new BigNumberInBase(Math.abs(position.quantity));
    const oppositeSide = position.side === 'long' ? OrderSide.Sell : OrderSide.Buy;

    const msg = MsgCreateDerivativeMarketOrder.fromJSON({
      marketId,
      injectiveAddress: this.walletAddress,
      orderType: oppositeSide,
      price: '0',
      quantity: quantity.toFixed(),
      margin: '0',
      triggerPrice: '0',
    });

    return JSON.stringify(msg.toData());
  }

  /**
   * Get current position for a market
   */
  async getPosition(marketId: string): Promise<Position | null> {
    try {
      const positions = await this.indexerDerivativesApi.fetchPositions({
        marketId,
        subaccountId: this.walletAddress,
      });

      if (!positions || positions.length === 0) {
        return null;
      }

      const pos = positions[0];
      return {
        marketId: pos.marketId,
        symbol: pos.ticker,
        side: parseFloat(pos.quantity) > 0 ? 'long' : 'short',
        quantity: Math.abs(parseFloat(pos.quantity)),
        entryPrice: parseFloat(pos.entryPrice),
        leverage: parseFloat(pos.leverage),
        unrealizedPnl: parseFloat(pos.unrealizedPnl),
        margin: parseFloat(pos.margin),
      };
    } catch (error) {
      console.error('Failed to get position:', error);
      return null;
    }
  }

  /**
   * Get all open positions
   */
  async getAllPositions(): Promise<Position[]> {
    try {
      const positions = await this.indexerDerivativesApi.fetchPositions({
        subaccountId: this.walletAddress,
      });

      return positions.map(pos => ({
        marketId: pos.marketId,
        symbol: pos.ticker,
        side: parseFloat(pos.quantity) > 0 ? 'long' : 'short',
        quantity: Math.abs(parseFloat(pos.quantity)),
        entryPrice: parseFloat(pos.entryPrice),
        leverage: parseFloat(pos.leverage),
        unrealizedPnl: parseFloat(pos.unrealizedPnl),
        margin: parseFloat(pos.margin),
      }));
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  /**
   * Get USDT balance
   */
  async getUSDTBalance(): Promise<number> {
    try {
      const response = await fetch(
        `${this.endpoints.rest}/cosmos/bank/v1beta1/balances/${this.walletAddress}`
      );
      const data = await response.json();

      const usdtDenom = 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7';
      const usdtBalance = data.balances?.find((b: any) => b.denom === usdtDenom);

      return usdtBalance ? parseFloat(usdtBalance.amount) / 1e6 : 0;
    } catch (error) {
      console.error('Failed to fetch USDT balance:', error);
      return 0;
    }
  }

  /**
   * Get account portfolio value
   */
  async getPortfolioValue(): Promise<number> {
    try {
      const portfolio = await this.indexerAccountApi.fetchPortfolio(this.walletAddress);
      return parseFloat(portfolio.accountTotalValue || '0');
    } catch (error) {
      console.error('Failed to fetch portfolio value:', error);
      return 0;
    }
  }

  /**
   * Get available markets
   */
  async getAvailableMarkets(): Promise<Array<{ symbol: string; marketId: string; ticker: string }>> {
    try {
      const markets = await this.indexerDerivativesApi.fetchMarkets();
      
      return markets
        .filter(m => m.ticker.includes('PERP') && m.quoteDenom.includes('USDT'))
        .map(m => ({
          symbol: m.ticker.split('/')[0],
          marketId: m.marketId,
          ticker: m.ticker,
        }));
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      return [];
    }
  }
}
