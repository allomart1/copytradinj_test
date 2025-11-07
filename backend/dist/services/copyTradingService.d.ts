interface CopyTradingConfig {
    wallet_address: string;
    target_wallet: string;
    amount: number;
    selected_assets: string[];
    is_active: boolean;
}
export declare class CopyTradingService {
    private monitors;
    private executors;
    startMonitoring(config: CopyTradingConfig): Promise<void>;
    stopMonitoring(walletAddress: string): void;
    private storeTrade;
    loadActiveConfigs(): Promise<void>;
}
export {};
//# sourceMappingURL=copyTradingService.d.ts.map