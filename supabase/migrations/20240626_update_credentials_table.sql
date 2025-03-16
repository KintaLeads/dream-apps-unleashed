
-- Add session_data and status columns to api_credentials table if they don't exist
ALTER TABLE IF EXISTS api_credentials 
ADD COLUMN IF NOT EXISTS session_data TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
