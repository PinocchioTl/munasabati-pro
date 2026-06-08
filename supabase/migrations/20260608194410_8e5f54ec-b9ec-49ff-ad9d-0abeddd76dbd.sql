
-- 1) Lock down SECURITY DEFINER trigger function (must not be callable via API)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2) Remove overly permissive public INSERT on booking_requests.
-- Public submissions go through a server function using the service role (bypasses RLS).
DROP POLICY IF EXISTS "Anyone can submit a request" ON public.booking_requests;

-- 3) Remove public SELECT on profiles to avoid leaking phone/etc to anon.
-- Public booking pages read profiles via a server function using the service role.
DROP POLICY IF EXISTS "Public can view enabled profiles" ON public.profiles;

-- 4) Storage RLS: restrict writes on 'item-images' and 'branding' to the owning user's folder.
-- Files are uploaded under "{auth.uid()}/..." (see BrandingSettings, BookingPlatformSettings, db.ts).
-- Buckets remain public for reads (public URLs).

DROP POLICY IF EXISTS "item-images owner can insert" ON storage.objects;
DROP POLICY IF EXISTS "item-images owner can update" ON storage.objects;
DROP POLICY IF EXISTS "item-images owner can delete" ON storage.objects;
DROP POLICY IF EXISTS "branding owner can insert" ON storage.objects;
DROP POLICY IF EXISTS "branding owner can update" ON storage.objects;
DROP POLICY IF EXISTS "branding owner can delete" ON storage.objects;

CREATE POLICY "item-images owner can insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "item-images owner can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "item-images owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "branding owner can insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "branding owner can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "branding owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
