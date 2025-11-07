/**
 * Hyperliquid WebSocket Monitor
 * Connects to Hyperliquid's WebSocket API to monitor a target wallet's trades
 */

export interface HyperliquidTrade {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  leverage: number;
  accountBalance: number;
  takeProfit?: number;
  stopLoss?: number;
}

export interface HyperliquidClose {
  symbol: string;
  exitPrice: number;
  pnl: number;
}

export class HyperliquidMonitor {
  private ws: WebSocket | null = null;
  private targetAddress: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private onNewTradeCallback?: (trade: HyperliquidTrade) => void;
  private onCloseTradeCallback?: (close: HyperliquidClose) => void;
  private existingPositions = new Set<string>();

  constructor(targetAddress: string) {
    this.targetAddress = targetAddress;
  }

  connect() {
    try {
      // Hyperliquid WebSocket endpoint
      // Note: This is a placeholder - you'll need to use the actual Hyperliquid WebSocket URL
      const wsUrl = 'wss://api.hyperliquid.xyz/ws';
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to Hyperliquid WebSocket');
        this.reconnectAttempts = 0;

        // Subscribe to user updates for the target address
        this.subscribe();
        
        // Fetch existing positions to ignore them
        this.fetchExistingPositions();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect to Hyperliquid WebSocket:', error);
    }
  }

  private subscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Subscribe to user updates
    const subscribeMessage = {
      method: 'subscribe',
      subscription: {
        type: 'userEvents',
        user: this.targetAddress,
      },
    };

    this.ws.send(JSON.stringify(subscribeMessage));
  }

  private async fetchExistingPositions() {
    try {
      // Fetch current positions from Hyperliquid API
      // This is a placeholder - implement actual API call
      const response = await fetch(`https://api.hyperliquid.xyz/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: this.targetAddress,
        }),
      });

      const data = await response.json();
      
      // Store existing position symbols to ignore them
      if (data.assetPositions) {
        data.assetPositions.forEach((position: any) => {
          if (position.position.szi !== '0') {
            this.existingPositions.add(position.position.coin);
          }
        });
      }

      console.log('Existing positions loaded:', Array.from(this.existingPositions));
    } catch (error) {
      console.error('Failed to fetch existing positions:', error);
    }
  }

  private handleMessage(data: any) {
    // Handle different message types from Hyperliquid
    if (data.channel === 'user' && data.data) {
      const { fills, funding } = data.data;

      // Handle new fills (trades)
      if (fills && fills.length > 0) {
        fills.forEach((fill: any) => {
          this.handleFill(fill);
        });
      }
    }
  }

  private handleFill(fill: any) {
    const symbol = fill.coin;

    // Check if this is a new position (not in existing positions)
    if (this.existingPositions.has(symbol)) {
      console.log(`Ignoring existing position: ${symbol}`);
      return;
    }

    // Determine if this is opening or closing a position
    const isOpening = fill.startPosition === '0' || 
                      (parseFloat(fill.startPosition) * parseFloat(fill.dir)) < 0;

    if (isOpening) {
      // New position opened
      const trade: HyperliquidTrade = {
        symbol,
        side: parseFloat(fill.dir) > 0 ? 'long' : 'short',
        size: Math.abs(parseFloat(fill.sz)),
        entryPrice: parseFloat(fill.px),
        leverage: parseFloat(fill.leverage || '1'),
        accountBalance: parseFloat(fill.accountValue || '0'),
        // Note: TP/SL would need to be fetched from order data
      };

      console.log('New trade detected:', trade);
      this.onNewTradeCallback?.(trade);
    } else {
      // Position closed
      const close: HyperliquidClose = {
        symbol,
        exitPrice: parseFloat(fill.px),
        pnl: parseFloat(fill.closedPnl || '0'),
      };

      console.log('Trade close detected:', close);
      this.onCloseTradeCallback?.(close);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  onNewTrade(callback: (trade: HyperliquidTrade) => void) {
    this.onNewTradeCallback = callback;
  }

  onCloseTrade(callback: (close: HyperliquidClose) => void) {
    this.onCloseTradeCallback = callback;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
