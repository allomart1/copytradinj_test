import WebSocket from 'ws';
import fetch from 'node-fetch';
export class HyperliquidMonitor {
    constructor(targetAddress) {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 3000;
        this.previousPositions = new Map();
        this.isInitialized = false;
        this.heartbeatInterval = null;
        this.lastMessageTime = Date.now();
        this.targetAddress = targetAddress.toLowerCase();
        console.log('🔧 HyperliquidMonitor created for:', this.targetAddress);
    }
    async initialize() {
        console.log('🔍 Initializing Hyperliquid monitor for:', this.targetAddress);
        // Fetch current positions to establish baseline
        await this.fetchCurrentPositions();
        this.isInitialized = true;
        console.log('✅ Baseline positions loaded:', this.previousPositions.size);
        console.log('📊 Current positions:', Array.from(this.previousPositions.entries()).map(([coin, pos]) => ({
            coin,
            size: pos.szi,
            entryPrice: pos.entryPx
        })));
    }
    async fetchCurrentPositions() {
        try {
            console.log('📡 Fetching current positions from Hyperliquid API...');
            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'clearinghouseState',
                    user: this.targetAddress,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('📥 Received clearinghouse state:', JSON.stringify(data, null, 2));
            if (data.assetPositions) {
                this.previousPositions.clear();
                data.assetPositions.forEach((position) => {
                    const pos = position.position;
                    if (pos.szi !== '0') {
                        this.previousPositions.set(pos.coin, pos);
                        console.log(`📊 Existing position: ${pos.coin} - Size: ${pos.szi}, Entry: ${pos.entryPx}`);
                    }
                });
            }
            else {
                console.log('ℹ️ No asset positions in response');
            }
            return data;
        }
        catch (error) {
            console.error('❌ Failed to fetch Hyperliquid positions:', error);
            throw error;
        }
    }
    connect() {
        try {
            console.log('🔌 Connecting to Hyperliquid WebSocket...');
            console.log('🎯 Target address:', this.targetAddress);
            this.ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
            this.ws.on('open', () => {
                console.log('✅ Connected to Hyperliquid WebSocket');
                this.reconnectAttempts = 0;
                this.lastMessageTime = Date.now();
                this.subscribe();
                this.startHeartbeat();
            });
            this.ws.on('message', (data) => {
                try {
                    this.lastMessageTime = Date.now();
                    const message = JSON.parse(data.toString());
                    console.log('📨 WebSocket message received:', JSON.stringify(message, null, 2));
                    this.handleMessage(message);
                }
                catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                    console.error('Raw message:', data.toString());
                }
            });
            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
            });
            this.ws.on('close', (code, reason) => {
                console.log('🔌 WebSocket connection closed:', { code, reason: reason.toString() });
                this.stopHeartbeat();
                this.attemptReconnect();
            });
            this.ws.on('ping', () => {
                console.log('🏓 Received ping from server');
            });
            this.ws.on('pong', () => {
                console.log('🏓 Received pong from server');
            });
        }
        catch (error) {
            console.error('❌ Failed to connect to Hyperliquid WebSocket:', error);
            this.attemptReconnect();
        }
    }
    startHeartbeat() {
        console.log('💓 Starting heartbeat monitor');
        this.heartbeatInterval = setInterval(() => {
            const timeSinceLastMessage = Date.now() - this.lastMessageTime;
            console.log(`💓 Heartbeat check - Time since last message: ${timeSinceLastMessage}ms`);
            if (timeSinceLastMessage > 60000) { // 60 seconds
                console.warn('⚠️ No messages received for 60 seconds, connection may be stale');
            }
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('🏓 Sending ping to keep connection alive');
                this.ws.ping();
            }
        }, 30000); // Check every 30 seconds
    }
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            console.log('💔 Stopping heartbeat monitor');
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    subscribe() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not ready for subscription');
            return;
        }
        const subscribeMessage = {
            method: 'subscribe',
            subscription: {
                type: 'userEvents',
                user: this.targetAddress,
            },
        };
        console.log('📡 Subscribing to user events with message:', JSON.stringify(subscribeMessage, null, 2));
        this.ws.send(JSON.stringify(subscribeMessage));
        console.log('✅ Subscription message sent');
    }
    async handleMessage(message) {
        console.log('🔍 Processing message type:', message.channel || message.method || 'unknown');
        if (message.channel === 'subscriptionResponse') {
            console.log('✅ Subscription confirmed:', JSON.stringify(message.data, null, 2));
            return;
        }
        if (message.channel === 'user' && message.data) {
            console.log('👤 User event received:', JSON.stringify(message.data, null, 2));
            const { fills } = message.data;
            if (fills && fills.length > 0) {
                console.log('📨 Received fills:', fills.length);
                console.log('📋 Fill details:', JSON.stringify(fills, null, 2));
                for (const fill of fills) {
                    await this.handleFill(fill);
                }
            }
            else {
                console.log('ℹ️ User event with no fills');
            }
        }
        else {
            console.log('ℹ️ Unhandled message channel:', message.channel);
        }
    }
    async handleFill(fill) {
        console.log('🔍 Processing fill:', JSON.stringify(fill, null, 2));
        const symbol = fill.coin;
        const fillSize = parseFloat(fill.sz);
        const fillPrice = parseFloat(fill.px);
        const startPosition = parseFloat(fill.startPosition || '0');
        const direction = fill.dir; // "Open Long", "Close Long", "Open Short", "Close Short"
        console.log('📊 Fill analysis:', {
            symbol,
            fillSize,
            fillPrice,
            direction,
            startPosition,
            isInitialized: this.isInitialized,
        });
        if (!this.isInitialized) {
            console.log('⏳ Monitor not initialized yet, skipping fill');
            return;
        }
        // Determine if this is opening or closing a position
        const isOpening = direction.startsWith('Open');
        const isClosing = direction.startsWith('Close');
        const isLong = direction.includes('Long');
        const isShort = direction.includes('Short');
        console.log('🎯 Position action:', {
            isOpening,
            isClosing,
            isLong,
            isShort,
        });
        // Check if this position existed before monitoring started
        const previousPosition = this.previousPositions.get(symbol);
        console.log('📋 Previous position for', symbol, ':', previousPosition ? JSON.stringify(previousPosition) : 'NONE');
        // Handle position closing - remove from cache
        if (isClosing) {
            console.log('🔒 Position closing detected for', symbol);
            if (previousPosition) {
                console.log('🗑️ Removing', symbol, 'from position cache');
                this.previousPositions.delete(symbol);
            }
            // Don't copy close trades, only opening trades
            console.log('ℹ️ Ignoring close trade');
            return;
        }
        // Handle position opening
        if (isOpening) {
            // Check if this is a genuinely new position (not in our baseline)
            if (previousPosition) {
                console.log(`ℹ️ Ignoring fill - position existed before monitoring started: ${symbol}`);
                return;
            }
            // This is a NEW position opened after monitoring started!
            const trade = {
                symbol,
                side: isLong ? 'long' : 'short',
                size: Math.abs(fillSize),
                entryPrice: fillPrice,
                leverage: parseFloat(fill.leverage?.value || '1'),
                timestamp: Date.now(),
            };
            console.log('🆕 NEW TRADE DETECTED:', JSON.stringify(trade, null, 2));
            console.log('📞 Calling trade callback...');
            if (this.onNewTradeCallback) {
                this.onNewTradeCallback(trade);
                console.log('✅ Trade callback executed');
            }
            else {
                console.warn('⚠️ No trade callback registered!');
            }
            // Update our tracking - refresh positions to get the new one
            console.log('🔄 Refreshing position tracking...');
            await this.fetchCurrentPositions();
        }
    }
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    onNewTrade(callback) {
        console.log('📝 Registering trade callback');
        this.onNewTradeCallback = callback;
    }
    disconnect() {
        console.log('🔌 Disconnecting Hyperliquid monitor');
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.previousPositions.clear();
        this.isInitialized = false;
    }
    // Get current positions for a user
    static async getPositions(address) {
        try {
            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'clearinghouseState',
                    user: address.toLowerCase(),
                }),
            });
            const data = await response.json();
            if (data.assetPositions) {
                return data.assetPositions
                    .map((p) => p.position)
                    .filter((p) => p.szi !== '0');
            }
            return [];
        }
        catch (error) {
            console.error('Failed to fetch Hyperliquid positions:', error);
            return [];
        }
    }
}
//# sourceMappingURL=hyperliquidMonitor.js.map