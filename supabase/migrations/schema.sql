-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master traders table
CREATE TABLE IF NOT EXISTS master_traders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hyperliquid_address TEXT UNIQUE NOT NULL,
    name TEXT,
    description TEXT,
    total_followers INTEGER DEFAULT 0,
    total_volume DECIMAL(20, 8) DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy settings table
CREATE TABLE IF NOT EXISTS copy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    master_trader_id UUID REFERENCES master_traders(id) ON DELETE CASCADE,
    copy_percentage DECIMAL(5, 2) NOT NULL CHECK (copy_percentage > 0 AND copy_percentage <= 100),
    max_position_size DECIMAL(20, 8),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, master_trader_id)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    master_trader_id UUID REFERENCES master_traders(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    size DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    master_trade_hash TEXT,
    copy_trade_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'executed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    master_trader_id UUID REFERENCES master_traders(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    size DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    current_price DECIMAL(20, 8),
    unrealized_pnl DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, master_trader_id, symbol)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_master_traders_address ON master_traders(hyperliquid_address);
CREATE INDEX IF NOT EXISTS idx_copy_settings_user_id ON copy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_settings_master_trader_id ON copy_settings(master_trader_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_master_trader_id ON trades(master_trader_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_master_trader_id ON positions(master_trader_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_traders ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Anyone can read master traders
CREATE POLICY master_traders_select_policy ON master_traders
    FOR SELECT
    TO authenticated
    USING (true);

-- Users can only manage their own copy settings
CREATE POLICY copy_settings_select_policy ON copy_settings
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY copy_settings_insert_policy ON copy_settings
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY copy_settings_update_policy ON copy_settings
    FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY copy_settings_delete_policy ON copy_settings
    FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Users can only read their own trades
CREATE POLICY trades_select_policy ON trades
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can only read their own positions
CREATE POLICY positions_select_policy ON positions
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_traders_updated_at BEFORE UPDATE ON master_traders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copy_settings_updated_at BEFORE UPDATE ON copy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
