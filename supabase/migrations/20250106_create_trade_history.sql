-- Create trade_history table for copy trading
CREATE TABLE IF NOT EXISTS trade_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    size DECIMAL(20, 8) NOT NULL,
    leverage DECIMAL(5, 2),
    entry_price DECIMAL(20, 8) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'failed')),
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trade_history_wallet_address ON trade_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trade_history_symbol ON trade_history(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_history_status ON trade_history(status);
CREATE INDEX IF NOT EXISTS idx_trade_history_created_at ON trade_history(created_at DESC);

-- Enable RLS
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only read their own trades
CREATE POLICY trade_history_select_policy ON trade_history
    FOR SELECT
    USING (auth.uid()::text = wallet_address OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Trigger to update updated_at
CREATE TRIGGER update_trade_history_updated_at 
    BEFORE UPDATE ON trade_history
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
