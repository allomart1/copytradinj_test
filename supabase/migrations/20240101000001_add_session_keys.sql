-- Create session_keys table for storing encrypted session keys
CREATE TABLE IF NOT EXISTS session_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_keys_wallet ON session_keys(wallet_address);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_session_keys_expires ON session_keys(expires_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_keys_updated_at
  BEFORE UPDATE ON session_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
