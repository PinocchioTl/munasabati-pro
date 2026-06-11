DROP POLICY IF EXISTS "Anyone can submit booking requests" ON public.booking_requests;

CREATE POLICY "Anyone can submit booking requests to enabled owners"
ON public.booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = booking_requests.owner_id
      AND COALESCE(p.booking_enabled, true) = true
      AND p.public_slug IS NOT NULL
  )
);