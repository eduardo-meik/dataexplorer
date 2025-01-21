/*
  # Initial Schema Setup

  1. Tables
    - users (managed by Supabase Auth)
    - datasets
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - data (jsonb)
      - created_at (timestamp)
      - user_id (uuid, foreign key)

  2. Security
    - Enable RLS on datasets table
    - Add policies for CRUD operations
*/

-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_name CHECK (char_length(name) > 0)
);

-- Enable RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own datasets"
  ON datasets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own datasets"
  ON datasets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON datasets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON datasets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS datasets_user_id_idx ON datasets(user_id);
CREATE INDEX IF NOT EXISTS datasets_created_at_idx ON datasets(created_at);