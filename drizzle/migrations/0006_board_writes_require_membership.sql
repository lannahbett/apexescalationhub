DROP POLICY IF EXISTS "Signed-in teammates add parts" ON public.board_parts;
DROP POLICY IF EXISTS "Signed-in teammates update parts" ON public.board_parts;
DROP POLICY IF EXISTS "Signed-in teammates remove parts" ON public.board_parts;
CREATE POLICY "Board members add parts" ON public.board_parts FOR INSERT TO authenticated WITH CHECK (public.is_board_member());
CREATE POLICY "Board members update parts" ON public.board_parts FOR UPDATE TO authenticated USING (public.is_board_member()) WITH CHECK (public.is_board_member());
CREATE POLICY "Board members remove parts" ON public.board_parts FOR DELETE TO authenticated USING (public.is_board_member());
