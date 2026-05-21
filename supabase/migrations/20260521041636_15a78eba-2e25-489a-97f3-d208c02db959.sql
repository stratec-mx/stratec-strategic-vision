CREATE POLICY "Public can submit web leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (source = 'web' AND owner_id IS NULL);