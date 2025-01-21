/*
  # Create storage bucket for datasets

  1. New Storage Bucket
    - Creates a new public bucket named 'datasets' for storing uploaded files
  
  2. Storage Policies
    - Enable authenticated users to upload files
    - Allow public read access to files
    - Allow owners to delete their files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', true);

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'datasets');

-- Policy to allow public file downloads
CREATE POLICY "Allow public downloads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'datasets');

-- Policy to allow file owners to delete their files
CREATE POLICY "Allow owners to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'datasets' 
  AND auth.uid() = owner
);