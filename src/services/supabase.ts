import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserConfig {
  wallet_address: string;
  target_wallet: string;
  selected_assets: string[];
  copy_amount: string;
  is_active: boolean;
  max_leverage: number;
  created_at?: string;
  updated_at?: string;
}

export interface TradeHistory {
  id?: string;
  wallet_address: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  exit_price?: number;
  leverage: number;
  pnl?: number;
  status: 'open' | 'closed';
  tx_hash?: string;
  created_at?: string;
  closed_at?: string;
}

export class SupabaseService {
  // User Configuration
  async saveUserConfig(config: UserConfig): Promise<void> {
    const { error } = await supabase
      .from('user_configs')
      .upsert({
        ...config,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wallet_address'
      });

    if (error) throw error;
  }

  async getUserConfig(walletAddress: string): Promise<UserConfig | null> {
    const { data, error } = await supabase
      .from('user_configs')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getAllActiveConfigs(): Promise<UserConfig[]> {
    const { data, error } = await supabase
      .from('user_configs')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async deactivateConfig(walletAddress: string): Promise<void> {
    const { error } = await supabase
      .from('user_configs')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('wallet_address', walletAddress);

    if (error) throw error;
  }

  // Trade History
  async saveTrade(trade: TradeHistory): Promise<string> {
    const { data, error } = await supabase
      .from('trade_history')
      .insert({
        ...trade,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async updateTrade(id: string, updates: Partial<TradeHistory>): Promise<void> {
    const { error } = await supabase
      .from('trade_history')
      .update({
        ...updates,
        closed_at: updates.status === 'closed' ? new Date().toISOString() : undefined,
      })
      .eq('id', id);

    if (error) throw error;
  }

  async getUserTrades(walletAddress: string, limit = 50): Promise<TradeHistory[]> {
    const { data, error } = await supabase
      .from('trade_history')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getOpenPositions(walletAddress: string): Promise<TradeHistory[]> {
    const { data, error } = await supabase
      .from('trade_history')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('status', 'open');

    if (error) throw error;
    return data || [];
  }

  // Real-time subscriptions
  subscribeToUserConfig(walletAddress: string, callback: (config: UserConfig) => void) {
    return supabase
      .channel(`config:${walletAddress}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_configs',
          filter: `wallet_address=eq.${walletAddress}`,
        },
        (payload) => callback(payload.new as UserConfig)
      )
      .subscribe();
  }

  subscribeToTrades(walletAddress: string, callback: (trade: TradeHistory) => void) {
    return supabase
      .channel(`trades:${walletAddress}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_history',
          filter: `wallet_address=eq.${walletAddress}`,
        },
        (payload) => callback(payload.new as TradeHistory)
      )
      .subscribe();
  }
}

export const supabaseService = new SupabaseService();
