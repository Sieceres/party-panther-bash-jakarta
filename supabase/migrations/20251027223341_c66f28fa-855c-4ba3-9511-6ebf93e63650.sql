-- Setup RLS policies for "Party Panther Bucket I" storage bucket

-- Allow public read access for images
CREATE POLICY "Public Access for Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Party Panther Bucket I');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Party Panther Bucket I');

-- Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Party Panther Bucket I' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images, or admins to delete any
CREATE POLICY "Users can delete own images or admins delete any"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Party Panther Bucket I' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND (is_admin = true OR is_super_admin = true)
    )
  )
);