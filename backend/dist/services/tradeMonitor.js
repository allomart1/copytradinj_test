import { WebSocket } from 'ws';
import { supabase } from './supabase.js';
export class TradeMonitor {
    constructor() {
        this.ws = null;
        this.reconnectInterval = 5000;
        this.isConnected = false;
    }
    async start() {
        console.log('Starting trade monitor...');
        this.connect();
    }
    connect() {
        try {
            // Connect to Hyperliquid WebSocket
            // Note: Replace with actual Hyperliquid WebSocket endpoint
            this.ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
            this.ws.on('open', () => {
                console.log('Connected to Hyperliquid WebSocket');
                this.isConnected = true;
                this.subscribe();
            });
            this.ws.on('message', (data) => {
                this.handleMessage(data);
            });
            this.ws.on('close', () => {
                console.log('Disconnected from Hyperliquid WebSocket');
                this.isConnected = false;
                this.reconnect();
            });
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        }
        catch (error) {
            console.error('Failed to connect:', error);
            this.reconnect();
        }
    }
    subscribe() {
        if (!this.ws || !this.isConnected)
            return;
        // Subscribe to trade updates
        const subscribeMessage = {
            type: 'subscribe',
            channel: 'trades'
        };
        this.ws.send(JSON.stringify(subscribeMessage));
    }
    async handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            if (message.type === 'trade') {
                await this.processTrade(message.data);
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
        }
    }
    async processTrade(tradeData) {
        console.log('Processing trade:', tradeData);
        // Check if this trader is being followed
        const { data: masterTrader } = await supabase
            .from('master_traders')
            .select('*')
            .eq('hyperliquid_address', tradeData.trader)
            .single();
        if (!masterTrader)
            return;
        // Get all users copying this trader
        const { data: copySettings } = await supabase
            .from('copy_settings')
            .select('*')
            .eq('master_trader_id', masterTrader.id)
            .eq('enabled', true);
        if (!copySettings || copySettings.length === 0)
            return;
        // Execute copy trades for each follower
        for (const settings of copySettings) {
            await this.executeCopyTrade(settings, tradeData);
        }
    }
    async executeCopyTrade(settings, tradeData) {
        try {
            // Calculate position size based on copy percentage
            const copySize = tradeData.size * (settings.copy_percentage / 100);
            // Check max position size
            if (settings.max_position_size && copySize > settings.max_position_size) {
                console.log('Trade exceeds max position size, skipping');
                return;
            }
            // Record trade in database
            const { error } = await supabase
                .from('trades')
                .insert({
                user_id: settings.user_id,
                master_trader_id: settings.master_trader_id,
                symbol: tradeData.symbol,
                side: tradeData.side,
                size: copySize,
                price: tradeData.price,
                master_trade_hash: tradeData.hash,
                status: 'pending'
            });
            if (error) {
                console.error('Failed to record trade:', error);
                return;
            }
            // TODO: Execute trade on Injective
            console.log('Copy trade recorded:', {
                user: settings.user_id,
                symbol: tradeData.symbol,
                size: copySize
            });
        }
        catch (error) {
            console.error('Error executing copy trade:', error);
        }
    }
    reconnect() {
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.connect();
        }, this.reconnectInterval);
    }
    stop() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
//# sourceMappingURL=tradeMonitor.js.map