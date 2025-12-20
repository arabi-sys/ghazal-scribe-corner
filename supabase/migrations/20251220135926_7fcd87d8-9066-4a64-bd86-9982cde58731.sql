-- Allow admins to upload ebook files
CREATE POLICY "Admins can upload ebook files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ebook-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update ebook files
CREATE POLICY "Admins can update ebook files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ebook-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete ebook files
CREATE POLICY "Admins can delete ebook files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ebook-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow authenticated users to download ebook files (for purchased ebooks)
CREATE POLICY "Users can download purchased ebook files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ebook-files' 
  AND auth.role() = 'authenticated'
);