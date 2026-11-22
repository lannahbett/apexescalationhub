CREATE TABLE public.board_invites (
  email text PRIMARY KEY CHECK (email = lower(email) AND char_length(email) <= 254 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  added_by text NOT NULL DEFAULT (auth.jwt() ->> 'sub'),
  added_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.board_invites TO authenticated;
GRANT ALL ON public.board_invites TO service_role;
ALTER TABLE public.board_invites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.board_members ADD COLUMN IF NOT EXISTS email text;

CREATE POLICY "Teammates see invites" ON public.board_invites FOR SELECT TO authenticated USING (public.is_board_member());
CREATE POLICY "Teammates invite colleagues" ON public.board_invites FOR INSERT TO authenticated WITH CHECK (public.is_board_member() AND added_by = (auth.jwt() ->> 'sub'));
CREATE POLICY "Teammates cancel invites" ON public.board_invites FOR DELETE TO authenticated USING (public.is_board_member());

CREATE POLICY "Teammates see the team" ON public.board_members FOR SELECT TO authenticated USING (public.is_board_member());
CREATE POLICY "Teammates remove teammates" ON public.board_members FOR DELETE TO authenticated USING (public.is_board_member());
GRANT SELECT, DELETE ON public.board_members TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_board_membership()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _sub text := auth.jwt() ->> 'sub';
  _email text := lower(nullif(auth.jwt() ->> 'email', ''));
BEGIN
  IF _sub IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM board_members WHERE sub = _sub) THEN RETURN true; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('board_members_bootstrap'));
  IF NOT EXISTS (SELECT 1 FROM board_members) THEN
    INSERT INTO board_members(sub, email) VALUES (_sub, _email);
    RETURN true;
  END IF;
  IF _email IS NOT NULL AND EXISTS (SELECT 1 FROM board_invites WHERE email = _email) THEN
    INSERT INTO board_members(sub, email) VALUES (_sub, _email);
    DELETE FROM board_invites WHERE email = _email;
    RETURN true;
  END IF;
  RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.claim_board_membership() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_board_membership() TO authenticated;