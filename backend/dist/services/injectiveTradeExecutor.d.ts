import { HyperliquidTrade } from './hyperliquidMonitor.js';
export declare class InjectiveTradeExecutor {
    private walletAddress;
    private copyAmount;
    private selectedAssets;
    private network;
    private endpoints;
    constructor(walletAddress: string, copyAmount: number, selectedAssets: string[]);
    /**
     * Prepare a trade for user approval
     * This creates a pending trade that the user must approve via their wallet
     */
    executeTrade(trade: HyperliquidTrade): Promise<any>;
    /**
     * Build transaction message for user to sign
     * This is called by the frontend when user approves a pending trade
     */
    buildTradeMessage(tradeId: string): Promise<any>;
    private calculateProportionalSize;
    private getMarketId;
}
//# sourceMappingURL=injectiveTradeExecutor.d.ts.map