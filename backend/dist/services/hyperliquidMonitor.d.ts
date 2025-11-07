export interface HyperliquidPosition {
    coin: string;
    szi: string;
    entryPx: string;
    leverage: {
        type: string;
        value: number;
    };
    unrealizedPnl: string;
    returnOnEquity: string;
    positionValue: string;
    liquidationPx: string | null;
}
export interface HyperliquidTrade {
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    leverage: number;
    timestamp: number;
}
export declare class HyperliquidMonitor {
    private ws;
    private targetAddress;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private onNewTradeCallback?;
    private previousPositions;
    private isInitialized;
    private heartbeatInterval;
    private lastMessageTime;
    constructor(targetAddress: string);
    initialize(): Promise<void>;
    private fetchCurrentPositions;
    connect(): void;
    private startHeartbeat;
    private stopHeartbeat;
    private subscribe;
    private handleMessage;
    private handleFill;
    private attemptReconnect;
    onNewTrade(callback: (trade: HyperliquidTrade) => void): void;
    disconnect(): void;
    static getPositions(address: string): Promise<HyperliquidPosition[]>;
}
//# sourceMappingURL=hyperliquidMonitor.d.ts.map