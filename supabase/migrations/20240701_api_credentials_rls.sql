
-- First, make sure RLS is enabled for the api_credentials table
ALTER TABLE IF EXISTS api_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own credentials
CREATE POLICY "Users can view their own credentials" 
  ON api_credentials 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own credentials
CREATE POLICY "Users can create their own credentials" 
  ON api_credentials 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own credentials
CREATE POLICY "Users can update their own credentials" 
  ON api_credentials 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own credentials
CREATE POLICY "Users can delete their own credentials" 
  ON api_credentials 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Make sure the api_credentials table has a user_id column
ALTER TABLE IF EXISTS api_credentials 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update the schema to automatically set the user_id when a credential is created
ALTER TABLE IF EXISTS api_credentials 
ALTER COLUMN user_id SET DEFAULT auth.uid();
