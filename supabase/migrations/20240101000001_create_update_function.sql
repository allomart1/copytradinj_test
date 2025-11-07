-- Create function to update updated_at timestamp
-- This function is used by triggers to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add comment
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column to the current timestamp';
