/*
  # Update datasets table schema

  1. Changes
    - Add storage related columns:
      - storage_path (text): Path in storage bucket
      - file_url (text): Public URL for the file
      - size (bigint): File size in bytes
      - type (text): File MIME type
    - Add updated_at column with trigger
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to datasets table
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS size bigint,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_datasets_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add validation checks
ALTER TABLE datasets
ADD CONSTRAINT valid_storage_path CHECK (char_length(storage_path) > 0),
ADD CONSTRAINT valid_file_url CHECK (char_length(file_url) > 0),
ADD CONSTRAINT valid_size CHECK (size > 0);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS datasets_updated_at_idx ON datasets(updated_at);