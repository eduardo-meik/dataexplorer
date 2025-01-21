/*
  # Update datasets table schema
  
  1. Changes
    - Add storage-related columns
    - Make data column nullable
    - Add updated_at timestamp
    - Add validation constraints
    - Add performance indexes
  
  2. Security
    - Maintains existing RLS policies
    - Adds data validation constraints
*/

-- Add new columns to datasets table
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS size bigint,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Make data column nullable since we're storing files in storage bucket
ALTER TABLE datasets ALTER COLUMN data DROP NOT NULL;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create it again
DROP TRIGGER IF EXISTS update_datasets_updated_at ON datasets;
CREATE TRIGGER update_datasets_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing constraints if they exist
ALTER TABLE datasets 
DROP CONSTRAINT IF EXISTS valid_storage_path,
DROP CONSTRAINT IF EXISTS valid_file_url,
DROP CONSTRAINT IF EXISTS valid_size;

-- Add validation checks
ALTER TABLE datasets
ADD CONSTRAINT valid_storage_path CHECK (char_length(storage_path) > 0),
ADD CONSTRAINT valid_file_url CHECK (char_length(file_url) > 0),
ADD CONSTRAINT valid_size CHECK (size > 0);

-- Create index for faster queries
DROP INDEX IF EXISTS datasets_updated_at_idx;
CREATE INDEX datasets_updated_at_idx ON datasets(updated_at);