
GRANT INSERT ON public.booking_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.booking_requests TO authenticated;
GRANT ALL ON public.booking_requests TO service_role;

DROP POLICY IF EXISTS "Anyone can submit booking requests" ON public.booking_requests;
CREATE POLICY "Anyone can submit booking requests"
ON public.booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
