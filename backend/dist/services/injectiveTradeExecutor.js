import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { MsgCreateDerivativeMarketOrder, getDefaultSubaccountId, } from '@injectivelabs/sdk-ts';
import { BigNumberInBase } from '@injectivelabs/utils';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
export class InjectiveTradeExecutor {
    constructor(walletAddress, copyAmount, selectedAssets) {
        this.network = Network.Mainnet;
        this.endpoints = getNetworkEndpoints(Network.Mainnet);
        this.walletAddress = walletAddress;
        this.copyAmount = copyAmount;
        this.selectedAssets = selectedAssets;
        console.log('✅ InjectiveTradeExecutor initialized (non-custodial) for wallet:', this.walletAddress);
    }
    /**
     * Prepare a trade for user approval
     * This creates a pending trade that the user must approve via their wallet
     */
    async executeTrade(trade) {
        console.log('⚡ Preparing trade for user approval:', {
            wallet: this.walletAddress,
            trade,
            copyAmount: this.copyAmount,
        });
        // Check if asset is in selected list
        if (!this.selectedAssets.includes(trade.symbol)) {
            console.log(`⏭️ Skipping ${trade.symbol} - not in selected assets`);
            return {
                success: false,
                error: 'Asset not in selected list',
            };
        }
        try {
            // Get market ID for the symbol
            const marketId = await this.getMarketId(trade.symbol);
            if (!marketId) {
                throw new Error(`Market not found for symbol: ${trade.symbol}`);
            }
            console.log('📊 Market ID:', marketId);
            // Calculate order parameters
            const price = new BigNumberInBase(trade.entryPrice);
            const quantity = new BigNumberInBase(this.calculateProportionalSize(trade.size));
            const margin = quantity.times(price).dividedBy(trade.leverage);
            const orderParams = {
                price: price.toFixed(),
                quantity: quantity.toFixed(),
                margin: margin.toFixed(),
            };
            console.log('📝 Order parameters:', orderParams);
            // Create pending trade in database
            const pendingTrade = {
                id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                walletAddress: this.walletAddress,
                trade,
                marketId,
                orderParams,
                createdAt: Date.now(),
            };
            // Store pending trade for user approval
            const { error: dbError } = await supabase
                .from('pending_trades')
                .insert({
                id: pendingTrade.id,
                wallet_address: this.walletAddress,
                symbol: trade.symbol,
                side: trade.side,
                size: trade.size,
                entry_price: trade.entryPrice,
                leverage: Math.round(trade.leverage),
                market_id: marketId,
                order_params: orderParams,
                status: 'pending_approval',
                created_at: new Date().toISOString(),
            });
            if (dbError) {
                console.error('❌ Failed to store pending trade:', dbError);
                throw new Error('Failed to store pending trade');
            }
            console.log('✅ Pending trade created:', pendingTrade.id);
            console.log('⏳ Waiting for user approval via wallet...');
            // Return pending trade info
            // Frontend will detect this and prompt user to approve
            return {
                success: true,
                pending: true,
                tradeId: pendingTrade.id,
                message: 'Trade prepared - awaiting user approval',
                orderParams,
            };
        }
        catch (error) {
            console.error('❌ Failed to prepare trade:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Build transaction message for user to sign
     * This is called by the frontend when user approves a pending trade
     */
    async buildTradeMessage(tradeId) {
        try {
            // Fetch pending trade from database
            const { data: pendingTrade, error } = await supabase
                .from('pending_trades')
                .select('*')
                .eq('id', tradeId)
                .eq('wallet_address', this.walletAddress)
                .eq('status', 'pending_approval')
                .single();
            if (error || !pendingTrade) {
                throw new Error('Pending trade not found');
            }
            // Get default subaccount ID for the user
            const subaccountId = getDefaultSubaccountId(this.walletAddress);
            // Create the message with all required fields
            const msg = MsgCreateDerivativeMarketOrder.fromJSON({
                marketId: pendingTrade.market_id,
                subaccountId,
                feeRecipient: this.walletAddress, // User receives their own trading fees
                injectiveAddress: this.walletAddress,
                orderType: pendingTrade.side === 'long' ? 1 : 2, // 1 = Buy, 2 = Sell
                price: pendingTrade.order_params.price,
                quantity: pendingTrade.order_params.quantity,
                margin: pendingTrade.order_params.margin,
                triggerPrice: '0',
            });
            return {
                success: true,
                message: msg,
                tradeId,
            };
        }
        catch (error) {
            console.error('❌ Failed to build trade message:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    calculateProportionalSize(targetSize) {
        // Calculate proportional size based on copy amount
        // For now, use a simple percentage of the target size
        const proportionalSize = targetSize * 0.1; // 10% of target size
        console.log('📊 Proportional sizing:', {
            targetSize,
            proportionalSize,
            copyAmount: this.copyAmount,
        });
        return proportionalSize;
    }
    async getMarketId(symbol) {
        try {
            console.log('🔍 Looking up market ID for symbol:', symbol);
            // Query derivative markets from Injective indexer
            const response = await fetch(`${this.endpoints.indexer}/api/explorer/v1/derivative_markets`);
            if (!response.ok) {
                throw new Error(`Failed to fetch markets: ${response.statusText}`);
            }
            const data = await response.json();
            // Find market by ticker (e.g., "BTC/USDT PERP")
            const market = data.markets?.find((m) => {
                const ticker = m.ticker?.toUpperCase() || '';
                const symbolUpper = symbol.toUpperCase();
                // Match various ticker formats
                return (ticker.includes(symbolUpper) ||
                    ticker.startsWith(symbolUpper + '/') ||
                    ticker.startsWith(symbolUpper + '-'));
            });
            if (market) {
                console.log('✅ Found market:', {
                    marketId: market.marketId,
                    ticker: market.ticker,
                });
                return market.marketId;
            }
            console.error('❌ Market not found for symbol:', symbol);
            console.log('Available markets:', data.markets?.map((m) => m.ticker).join(', '));
            return null;
        }
        catch (error) {
            console.error('❌ Failed to get market ID:', error);
            return null;
        }
    }
}
//# sourceMappingURL=injectiveTradeExecutor.js.map