export declare class TradeMonitor {
    private ws;
    private reconnectInterval;
    private isConnected;
    start(): Promise<void>;
    private connect;
    private subscribe;
    private handleMessage;
    private processTrade;
    private executeCopyTrade;
    private reconnect;
    stop(): void;
}
//# sourceMappingURL=tradeMonitor.d.ts.map