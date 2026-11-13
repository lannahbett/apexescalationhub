CREATE TABLE public.board_parts (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT 'Sample data'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_parts TO authenticated;
GRANT ALL ON public.board_parts TO service_role;
ALTER TABLE public.board_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in teammates read the shared board" ON public.board_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in teammates add parts" ON public.board_parts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in teammates update parts" ON public.board_parts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in teammates remove parts" ON public.board_parts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE public.board_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid NOT NULL DEFAULT auth.uid(),
  actor_name text NOT NULL,
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 500)
);
GRANT SELECT, INSERT ON public.board_activity TO authenticated;
GRANT ALL ON public.board_activity TO service_role;
ALTER TABLE public.board_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in teammates read activity" ON public.board_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teammates log their own activity" ON public.board_activity FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
CREATE INDEX board_activity_at_idx ON public.board_activity (at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.board_parts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_activity;