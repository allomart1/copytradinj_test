import WebSocket from 'ws';

export interface HyperliquidPosition {
  coin: string;
  szi: string;
  leverage: {
    type: string;
    value: number;
  };
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
}

export interface HyperliquidTrade {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  leverage: number;
  timestamp: number;
  positionValue: number;
}

type TradeCallback = (trade: HyperliquidTrade) => void;

export class HyperliquidMonitor {
  private static instance: HyperliquidMonitor;
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private monitoredWallets = new Map<string, Set<TradeCallback>>();
  private positionCache = new Map<string, Map<string, HyperliquidPosition>>();

  private constructor() {}

  static getInstance(): HyperliquidMonitor {
    if (!HyperliquidMonitor.instance) {
      HyperliquidMonitor.instance = new HyperliquidMonitor();
    }
    return HyperliquidMonitor.instance;
  }

  async getPositions(address: string): Promise<HyperliquidPosition[]> {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: address,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.assetPositions || [];
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      throw error;
    }
  }

  async getTradeHistory(address: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'userFills',
          user: address,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
      throw error;
    }
  }

  monitorWallet(address: string, callback: TradeCallback): void {
    console.log('📊 Starting to monitor wallet:', address);

    if (!this.monitoredWallets.has(address)) {
      this.monitoredWallets.set(address, new Set());
      this.initializePositionCache(address);
    }

    this.monitoredWallets.get(address)!.add(callback);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    } else {
      this.subscribeToWallet(address);
    }
  }

  private async initializePositionCache(address: string): Promise<void> {
    try {
      console.log('🔄 Initializing position cache for:', address);
      const positions = await this.getPositions(address);

      const cache = new Map<string, HyperliquidPosition>();
      positions.forEach((pos) => {
        cache.set(pos.coin, pos);
      });

      this.positionCache.set(address, cache);
      console.log('✅ Position cache initialized:', cache.size, 'positions');
    } catch (error) {
      console.error('Failed to initialize position cache:', error);
    }
  }

  private connect(): void {
    if (this.isConnecting) {
      console.log('⏳ Already connecting to WebSocket...');
      return;
    }

    this.isConnecting = true;
    console.log('🔌 Connecting to Hyperliquid WebSocket...');

    this.ws = new WebSocket('wss://api.hyperliquid.xyz/ws');

    this.ws.on('open', () => {
      console.log('✅ WebSocket connected');
      this.isConnecting = false;

      this.monitoredWallets.forEach((_, address) => {
        this.subscribeToWallet(address);
      });
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.isConnecting = false;
    });

    this.ws.on('close', () => {
      console.log('🔌 WebSocket disconnected');
      this.isConnecting = false;
      this.ws = null;

      this.reconnectTimeout = setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        this.connect();
      }, 5000);
    });
  }

  private subscribeToWallet(address: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('⚠️ WebSocket not ready, skipping subscription');
      return;
    }

    console.log('📡 Subscribing to wallet updates:', address);

    this.ws.send(
      JSON.stringify({
        method: 'subscribe',
        subscription: {
          type: 'userEvents',
          user: address,
        },
      })
    );
  }

  private handleMessage(message: any): void {
    if (message.channel === 'user' && message.data) {
      const { user, fills } = message.data;

      if (!this.monitoredWallets.has(user)) {
        return;
      }

      console.log('📨 Received user event for:', user);
      console.log('Fills:', JSON.stringify(fills, null, 2));

      if (fills && fills.length > 0) {
        fills.forEach((fill: any) => {
          this.processFill(user, fill);
        });
      }
    }
  }

  private async processFill(user: string, fill: any): Promise<void> {
    try {
      console.log('🔍 Processing fill:', JSON.stringify(fill, null, 2));

      const currentPositions = await this.getPositions(user);
      const cache = this.positionCache.get(user) || new Map();

      const currentPosition = currentPositions.find((p) => p.coin === fill.coin);
      const cachedPosition = cache.get(fill.coin);

      console.log('Current position:', currentPosition);
      console.log('Cached position:', cachedPosition);

      if (currentPosition && !cachedPosition) {
        console.log('🆕 NEW POSITION DETECTED!');

        const trade: HyperliquidTrade = {
          symbol: fill.coin,
          side: parseFloat(currentPosition.szi) > 0 ? 'long' : 'short',
          size: Math.abs(parseFloat(currentPosition.szi)),
          entryPrice: parseFloat(currentPosition.entryPx),
          leverage: currentPosition.leverage.value,
          timestamp: Date.now(),
          positionValue: parseFloat(currentPosition.positionValue),
        };

        console.log('📢 Emitting new trade:', trade);

        const callbacks = this.monitoredWallets.get(user);
        if (callbacks) {
          callbacks.forEach((callback) => callback(trade));
        }

        cache.set(fill.coin, currentPosition);
      } else if (!currentPosition && cachedPosition) {
        console.log('🔒 Position closed:', fill.coin);
        cache.delete(fill.coin);
      } else if (currentPosition && cachedPosition) {
        const currentSize = Math.abs(parseFloat(currentPosition.szi));
        const cachedSize = Math.abs(parseFloat(cachedPosition.szi));

        if (currentSize > cachedSize) {
          console.log('📈 Position size increased');
          cache.set(fill.coin, currentPosition);
        } else if (currentSize < cachedSize) {
          console.log('📉 Position size decreased');
          cache.set(fill.coin, currentPosition);
        }
      }

      this.positionCache.set(user, cache);
    } catch (error) {
      console.error('Failed to process fill:', error);
    }
  }

  start(): void {
    console.log('🚀 Starting Hyperliquid monitor...');
    this.connect();
  }

  stop(): void {
    console.log('🛑 Stopping Hyperliquid monitor...');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.monitoredWallets.clear();
    this.positionCache.clear();
  }
}
