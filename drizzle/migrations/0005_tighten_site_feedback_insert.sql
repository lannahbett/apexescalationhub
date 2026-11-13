DROP POLICY IF EXISTS "Anyone can send feedback" ON public.site_feedback;
CREATE POLICY "Anyone can send valid feedback" ON public.site_feedback
FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(message)) BETWEEN 1 AND 2000
  AND (rating IS NULL OR rating BETWEEN 1 AND 5)
  AND (role IS NULL OR char_length(role) <= 80)
  AND (email IS NULL OR (char_length(email) <= 254 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
);