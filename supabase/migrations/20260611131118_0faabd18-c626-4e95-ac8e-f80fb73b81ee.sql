-- Drop login_attempts to prevent audit-log poisoning by anon users
DROP TABLE IF EXISTS public.login_attempts CASCADE;

-- Restrict authenticated reads on storage to the user's own folder.
-- Public buckets still serve files via public URLs (RLS-bypassed for the public endpoint).
DROP POLICY IF EXISTS "item-images owner can read" ON storage.objects;
CREATE POLICY "item-images owner can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'item-images' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "branding owner can read" ON storage.objects;
CREATE POLICY "branding owner can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'branding' AND (storage.foldername(name))[1] = (auth.uid())::text);
