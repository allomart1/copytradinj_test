-- Create pending_trades table for non-custodial trade approval
CREATE TABLE IF NOT EXISTS pending_trades (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    size TEXT NOT NULL,
    entry_price TEXT NOT NULL,
    leverage INTEGER NOT NULL,
    market_id TEXT NOT NULL,
    order_params JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_approval', 'approved', 'rejected', 'expired')),
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_trades_wallet_address ON pending_trades(wallet_address);
CREATE INDEX IF NOT EXISTS idx_pending_trades_status ON pending_trades(status);
CREATE INDEX IF NOT EXISTS idx_pending_trades_created_at ON pending_trades(created_at);

-- Row Level Security
ALTER TABLE pending_trades ENABLE ROW LEVEL SECURITY;

-- Users can only read their own pending trades
CREATE POLICY pending_trades_select_policy ON pending_trades
    FOR SELECT
    USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Function to auto-expire old pending trades
CREATE OR REPLACE FUNCTION expire_old_pending_trades()
RETURNS void AS $$
BEGIN
    UPDATE pending_trades
    SET status = 'expired'
    WHERE status = 'pending_approval'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run expiration (if pg_cron is available)
-- SELECT cron.schedule('expire-pending-trades', '* * * * *', 'SELECT expire_old_pending_trades()');
