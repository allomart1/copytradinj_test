-- Create session_keys table
CREATE TABLE IF NOT EXISTS session_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_keys_wallet_address ON session_keys(wallet_address);

-- Create index on is_active and expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_session_keys_active_expires ON session_keys(is_active, expires_at);

-- Add trigger to update updated_at
CREATE TRIGGER update_session_keys_updated_at 
    BEFORE UPDATE ON session_keys
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE session_keys IS 'Stores encrypted session keys for automated trade execution';
