import { BigNumberInBase } from '@injectivelabs/utils';

interface SafetyLimits {
  maxPositionSizeUSD: number;
  maxDailyTradesCount: number;
  maxDailyVolumeUSD: number;
  maxLeverage: number;
  maxSlippagePercent: number;
  minBalanceUSD: number;
  circuitBreakerLossPercent: number;
}

interface TradeValidation {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
}

interface DailyStats {
  tradesCount: number;
  totalVolumeUSD: number;
  lastResetDate: string;
  totalPnL: number;
}

class SafetyService {
  private limits: SafetyLimits = {
    maxPositionSizeUSD: 10000, // $10k max per position
    maxDailyTradesCount: 50, // 50 trades per day
    maxDailyVolumeUSD: 100000, // $100k daily volume
    maxLeverage: 20, // 20x max leverage
    maxSlippagePercent: 2, // 2% max slippage
    minBalanceUSD: 100, // $100 minimum balance
    circuitBreakerLossPercent: 10, // Stop if 10% daily loss
  };

  private dailyStats: Map<string, DailyStats> = new Map();

  /**
   * Update safety limits
   */
  updateLimits(newLimits: Partial<SafetyLimits>) {
    this.limits = { ...this.limits, ...newLimits };
    this.saveLimitsToStorage();
  }

  /**
   * Get current safety limits
   */
  getLimits(): SafetyLimits {
    return { ...this.limits };
  }

  /**
   * Validate trade before execution
   */
  validateTrade(
    walletAddress: string,
    trade: {
      symbol: string;
      side: 'long' | 'short';
      size: number;
      entryPrice: number;
      leverage: number;
    },
    currentBalance: number
  ): TradeValidation {
    const warnings: string[] = [];

    // Check minimum balance
    if (currentBalance < this.limits.minBalanceUSD) {
      return {
        allowed: false,
        reason: `Insufficient balance. Minimum required: $${this.limits.minBalanceUSD}`,
      };
    }

    // Check position size
    const positionSizeUSD = trade.size * trade.entryPrice;
    if (positionSizeUSD > this.limits.maxPositionSizeUSD) {
      return {
        allowed: false,
        reason: `Position size ($${positionSizeUSD.toFixed(2)}) exceeds maximum allowed ($${this.limits.maxPositionSizeUSD})`,
      };
    }

    // Check leverage
    if (trade.leverage > this.limits.maxLeverage) {
      return {
        allowed: false,
        reason: `Leverage (${trade.leverage}x) exceeds maximum allowed (${this.limits.maxLeverage}x)`,
      };
    }

    // Check daily limits
    const stats = this.getDailyStats(walletAddress);
    
    if (stats.tradesCount >= this.limits.maxDailyTradesCount) {
      return {
        allowed: false,
        reason: `Daily trade limit reached (${this.limits.maxDailyTradesCount} trades)`,
      };
    }

    if (stats.totalVolumeUSD + positionSizeUSD > this.limits.maxDailyVolumeUSD) {
      return {
        allowed: false,
        reason: `Daily volume limit would be exceeded. Current: $${stats.totalVolumeUSD.toFixed(2)}, Limit: $${this.limits.maxDailyVolumeUSD}`,
      };
    }

    // Check circuit breaker (daily loss limit)
    const dailyLossPercent = (stats.totalPnL / currentBalance) * 100;
    if (dailyLossPercent < -this.limits.circuitBreakerLossPercent) {
      return {
        allowed: false,
        reason: `Circuit breaker triggered. Daily loss (${Math.abs(dailyLossPercent).toFixed(2)}%) exceeds limit (${this.limits.circuitBreakerLossPercent}%)`,
      };
    }

    // Add warnings
    if (trade.leverage > 10) {
      warnings.push(`High leverage (${trade.leverage}x) increases liquidation risk`);
    }

    if (positionSizeUSD > currentBalance * 0.5) {
      warnings.push(`Position size is more than 50% of your balance`);
    }

    if (stats.tradesCount > this.limits.maxDailyTradesCount * 0.8) {
      warnings.push(`Approaching daily trade limit (${stats.tradesCount}/${this.limits.maxDailyTradesCount})`);
    }

    return {
      allowed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate slippage
   */
  validateSlippage(expectedPrice: number, executionPrice: number): TradeValidation {
    const slippagePercent = Math.abs((executionPrice - expectedPrice) / expectedPrice) * 100;

    if (slippagePercent > this.limits.maxSlippagePercent) {
      return {
        allowed: false,
        reason: `Slippage (${slippagePercent.toFixed(2)}%) exceeds maximum allowed (${this.limits.maxSlippagePercent}%)`,
      };
    }

    const warnings: string[] = [];
    if (slippagePercent > this.limits.maxSlippagePercent * 0.5) {
      warnings.push(`High slippage detected (${slippagePercent.toFixed(2)}%)`);
    }

    return {
      allowed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Record trade execution
   */
  recordTrade(
    walletAddress: string,
    trade: {
      size: number;
      entryPrice: number;
      pnl?: number;
    }
  ) {
    const stats = this.getDailyStats(walletAddress);
    
    stats.tradesCount++;
    stats.totalVolumeUSD += trade.size * trade.entryPrice;
    if (trade.pnl !== undefined) {
      stats.totalPnL += trade.pnl;
    }

    this.dailyStats.set(walletAddress, stats);
    this.saveStatsToStorage();
  }

  /**
   * Get daily statistics
   */
  getDailyStats(walletAddress: string): DailyStats {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.dailyStats.get(walletAddress);

    // Reset if new day
    if (!stats || stats.lastResetDate !== today) {
      const newStats: DailyStats = {
        tradesCount: 0,
        totalVolumeUSD: 0,
        lastResetDate: today,
        totalPnL: 0,
      };
      this.dailyStats.set(walletAddress, newStats);
      return newStats;
    }

    return stats;
  }

  /**
   * Check if circuit breaker is active
   */
  isCircuitBreakerActive(walletAddress: string, currentBalance: number): boolean {
    const stats = this.getDailyStats(walletAddress);
    const dailyLossPercent = (stats.totalPnL / currentBalance) * 100;
    return dailyLossPercent < -this.limits.circuitBreakerLossPercent;
  }

  /**
   * Get safety status
   */
  getSafetyStatus(walletAddress: string, currentBalance: number) {
    const stats = this.getDailyStats(walletAddress);
    const dailyLossPercent = (stats.totalPnL / currentBalance) * 100;

    return {
      circuitBreakerActive: this.isCircuitBreakerActive(walletAddress, currentBalance),
      dailyTradesUsed: stats.tradesCount,
      dailyTradesLimit: this.limits.maxDailyTradesCount,
      dailyVolumeUsed: stats.totalVolumeUSD,
      dailyVolumeLimit: this.limits.maxDailyVolumeUSD,
      dailyPnL: stats.totalPnL,
      dailyPnLPercent: dailyLossPercent,
      balanceStatus: currentBalance >= this.limits.minBalanceUSD ? 'ok' : 'low',
    };
  }

  /**
   * Reset daily stats (for testing or manual reset)
   */
  resetDailyStats(walletAddress: string) {
    this.dailyStats.delete(walletAddress);
    this.saveStatsToStorage();
  }

  /**
   * Save limits to localStorage
   */
  private saveLimitsToStorage() {
    try {
      localStorage.setItem('safety_limits', JSON.stringify(this.limits));
    } catch (error) {
      console.error('Failed to save safety limits:', error);
    }
  }

  /**
   * Load limits from localStorage
   */
  loadLimitsFromStorage() {
    try {
      const saved = localStorage.getItem('safety_limits');
      if (saved) {
        this.limits = { ...this.limits, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load safety limits:', error);
    }
  }

  /**
   * Save stats to localStorage
   */
  private saveStatsToStorage() {
    try {
      const statsObj = Object.fromEntries(this.dailyStats);
      localStorage.setItem('daily_stats', JSON.stringify(statsObj));
    } catch (error) {
      console.error('Failed to save daily stats:', error);
    }
  }

  /**
   * Load stats from localStorage
   */
  loadStatsFromStorage() {
    try {
      const saved = localStorage.getItem('daily_stats');
      if (saved) {
        const statsObj = JSON.parse(saved);
        this.dailyStats = new Map(Object.entries(statsObj));
      }
    } catch (error) {
      console.error('Failed to load daily stats:', error);
    }
  }
}

export const safetyService = new SafetyService();
