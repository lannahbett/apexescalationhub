CREATE TABLE public.board_members (
  sub text PRIMARY KEY,
  added_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.board_members TO authenticated;
GRANT ALL ON public.board_members TO service_role;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see their own membership" ON public.board_members FOR SELECT TO authenticated USING (sub = (auth.jwt() ->> 'sub'));

INSERT INTO public.board_members (sub) SELECT DISTINCT actor_sub FROM public.board_activity WHERE actor_sub IS NOT NULL ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_board_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.board_members WHERE sub = (auth.jwt() ->> 'sub'))
$$;
REVOKE EXECUTE ON FUNCTION public.is_board_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_board_member() TO authenticated;

DROP POLICY IF EXISTS "Signed-in teammates read activity" ON public.board_activity;
CREATE POLICY "Board members read activity" ON public.board_activity FOR SELECT TO authenticated USING (public.is_board_member());

DROP POLICY IF EXISTS "Signed-in teammates read the shared board" ON public.board_parts;
CREATE POLICY "Board members read the shared board" ON public.board_parts FOR SELECT TO authenticated USING (public.is_board_member());