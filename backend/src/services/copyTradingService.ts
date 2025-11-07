import { createClient } from '@supabase/supabase-js';
import { HyperliquidMonitor, HyperliquidTrade } from './hyperliquidMonitor.js';
import { InjectiveTradeExecutor } from './injectiveTradeExecutor.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface CopyTradingConfig {
  wallet_address: string;
  target_wallet: string;
  amount: number;
  selected_assets: string[];
  is_active: boolean;
}

export class CopyTradingService {
  private monitors = new Map<string, HyperliquidMonitor>();
  private executors = new Map<string, InjectiveTradeExecutor>();

  async startMonitoring(config: CopyTradingConfig) {
    const { wallet_address, target_wallet, amount, selected_assets } = config;

    console.log('🚀 Starting copy trading monitoring:', {
      wallet_address,
      target_wallet,
      amount,
      assets: selected_assets,
    });

    // Stop existing monitor if any
    this.stopMonitoring(wallet_address);

    // Create Hyperliquid monitor
    console.log('🔧 Creating Hyperliquid monitor...');
    const monitor = new HyperliquidMonitor(target_wallet);
    
    // Initialize monitor (fetch baseline positions)
    console.log('⚙️ Initializing monitor...');
    await monitor.initialize();

    // Create Injective executor
    console.log('🔧 Creating Injective executor...');
    const executor = new InjectiveTradeExecutor(wallet_address, amount, selected_assets);

    // Set up trade callback
    console.log('📝 Setting up trade callback...');
    monitor.onNewTrade(async (trade: HyperliquidTrade) => {
      console.log('🎯 TRADE CALLBACK TRIGGERED!');
      console.log('📢 New trade from target wallet:', JSON.stringify(trade, null, 2));
      
      try {
        console.log('⚡ Executing trade on Injective...');
        // Execute trade on Injective
        const result = await executor.executeTrade(trade);
        console.log('✅ Trade execution result:', JSON.stringify(result, null, 2));
        
        // Store in database
        console.log('💾 Storing trade in database...');
        await this.storeTrade(wallet_address, trade, result);
        
        console.log('✅ Trade executed and stored successfully');
      } catch (error) {
        console.error('❌ Failed to execute trade:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Store failed trade
        await this.storeTrade(wallet_address, trade, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Connect to WebSocket
    console.log('🔌 Connecting to Hyperliquid WebSocket...');
    monitor.connect();

    // Store monitor and executor
    this.monitors.set(wallet_address, monitor);
    this.executors.set(wallet_address, executor);

    console.log('✅ Monitoring started successfully for:', wallet_address);
    console.log('📊 Active monitors:', this.monitors.size);
  }

  stopMonitoring(walletAddress: string) {
    const monitor = this.monitors.get(walletAddress);
    if (monitor) {
      console.log('🛑 Stopping monitor for:', walletAddress);
      monitor.disconnect();
      this.monitors.delete(walletAddress);
      console.log('✅ Monitor stopped');
    } else {
      console.log('ℹ️ No active monitor found for:', walletAddress);
    }

    this.executors.delete(walletAddress);
  }

  private async storeTrade(
    walletAddress: string,
    trade: HyperliquidTrade,
    result: any
  ) {
    try {
      console.log('💾 Storing trade in database:', {
        walletAddress,
        symbol: trade.symbol,
        side: trade.side,
        size: trade.size,
        status: result.success ? 'open' : 'closed',
      });

      // Prepare the insert data matching the actual schema
      // Schema columns: id, wallet_address, symbol, side, size, entry_price, exit_price, 
      //                 leverage (INTEGER), pnl, status, tx_hash, created_at, closed_at
      const insertData = {
        wallet_address: walletAddress,
        symbol: trade.symbol,
        side: trade.side,
        size: trade.size,
        entry_price: trade.entryPrice,
        exit_price: null, // Will be set when position closes
        leverage: Math.round(trade.leverage), // Convert to INTEGER
        pnl: null, // Will be calculated when position closes
        status: result.success ? 'open' : 'closed',
        tx_hash: result.txHash || null,
        created_at: new Date(trade.timestamp).toISOString(),
        closed_at: null, // Will be set when position closes
      };

      console.log('📝 Insert data:', JSON.stringify(insertData, null, 2));

      const { data, error } = await supabase
        .from('trade_history')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ Failed to store trade in database:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      } else {
        console.log('✅ Trade stored successfully:', data);
      }
    } catch (error) {
      console.error('❌ Exception storing trade:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  }

  async loadActiveConfigs() {
    try {
      console.log('📋 Loading active copy trading configurations from database...');
      
      const { data, error } = await supabase
        .from('copy_trading_configs')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Failed to load active configs:', error);
        return;
      }

      console.log(`📊 Found ${data?.length || 0} active copy trading configs`);
      
      if (data && data.length > 0) {
        console.log('📋 Active configs:', JSON.stringify(data, null, 2));
      }

      for (const config of data || []) {
        console.log('🔄 Starting monitoring for config:', config.wallet_address);
        await this.startMonitoring(config);
      }

      console.log('✅ All active configs loaded and monitoring started');
    } catch (error) {
      console.error('❌ Exception loading active configs:', error);
    }
  }
}
