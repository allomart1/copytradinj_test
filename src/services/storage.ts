/**
 * Local Storage Service for Trade History
 */

import { Trade } from '../App';

const STORAGE_KEY = 'hyperliquid_copy_trades';

export class TradeStorage {
  /**
   * Get all trades from storage
   */
  static getTrades(): Trade[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load trades from storage:', error);
      return [];
    }
  }

  /**
   * Save a new trade to storage
   */
  static saveTrade(trade: Trade): void {
    try {
      const trades = this.getTrades();
      trades.push(trade);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (error) {
      console.error('Failed to save trade to storage:', error);
    }
  }

  /**
   * Update an existing trade in storage
   */
  static updateTrade(updatedTrade: Trade): void {
    try {
      const trades = this.getTrades();
      const index = trades.findIndex(t => t.id === updatedTrade.id);
      
      if (index !== -1) {
        trades[index] = updatedTrade;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
      }
    } catch (error) {
      console.error('Failed to update trade in storage:', error);
    }
  }

  /**
   * Delete a trade from storage
   */
  static deleteTrade(tradeId: string): void {
    try {
      const trades = this.getTrades();
      const filtered = trades.filter(t => t.id !== tradeId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete trade from storage:', error);
    }
  }

  /**
   * Clear all trades from storage
   */
  static clearTrades(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear trades from storage:', error);
    }
  }

  /**
   * Get trades by status
   */
  static getTradesByStatus(status: 'open' | 'closed'): Trade[] {
    return this.getTrades().filter(t => t.status === status);
  }

  /**
   * Get total PnL from closed trades
   */
  static getTotalPnL(): number {
    const closedTrades = this.getTradesByStatus('closed');
    return closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  }

  /**
   * Get success rate
   */
  static getSuccessRate(): number {
    const closedTrades = this.getTradesByStatus('closed');
    if (closedTrades.length === 0) return 0;

    const profitable = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    return (profitable / closedTrades.length) * 100;
  }
}
