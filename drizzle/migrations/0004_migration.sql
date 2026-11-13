CREATE TABLE public.site_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  rating smallint,
  role text,
  message text NOT NULL,
  email text,
  CONSTRAINT site_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CONSTRAINT site_feedback_message_len CHECK (char_length(message) BETWEEN 3 AND 2000),
  CONSTRAINT site_feedback_role_len CHECK (role IS NULL OR char_length(role) <= 80),
  CONSTRAINT site_feedback_email_len CHECK (email IS NULL OR char_length(email) <= 255)
);
GRANT INSERT ON public.site_feedback TO anon, authenticated;
GRANT ALL ON public.site_feedback TO service_role;
ALTER TABLE public.site_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send feedback" ON public.site_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);