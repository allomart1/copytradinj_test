export interface User {
    id: string;
    wallet_address: string;
    created_at: string;
    updated_at: string;
}
export interface MasterTrader {
    id: string;
    hyperliquid_address: string;
    name?: string;
    description?: string;
    total_followers: number;
    total_volume: number;
    win_rate: number;
    created_at: string;
    updated_at: string;
}
export interface CopySettings {
    id: string;
    user_id: string;
    master_trader_id: string;
    copy_percentage: number;
    max_position_size?: number;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}
export interface Trade {
    id: string;
    user_id: string;
    master_trader_id: string;
    symbol: string;
    side: 'buy' | 'sell';
    size: number;
    price: number;
    master_trade_hash?: string;
    copy_trade_hash?: string;
    status: 'pending' | 'executed' | 'failed';
    error_message?: string;
    created_at: string;
}
export interface Position {
    id: string;
    user_id: string;
    master_trader_id: string;
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entry_price: number;
    current_price?: number;
    unrealized_pnl?: number;
    created_at: string;
    updated_at: string;
}
//# sourceMappingURL=index.d.ts.map