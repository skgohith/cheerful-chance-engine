CREATE TABLE public.winner_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid NOT NULL,
  giveaway_title text NOT NULL,
  rank integer NOT NULL,
  instagram_username text NOT NULL,
  instagram_link text NOT NULL,
  full_name text NOT NULL,
  selected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (giveaway_id, rank)
);
GRANT SELECT ON public.winner_snapshots TO anon, authenticated;
GRANT ALL ON public.winner_snapshots TO service_role;
ALTER TABLE public.winner_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view winner snapshots" ON public.winner_snapshots
  FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.delete_giveaway_preserve_winners(p_giveaway_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.giveaways WHERE id = p_giveaway_id) THEN
    RAISE EXCEPTION 'Giveaway not found';
  END IF;

  INSERT INTO public.winner_snapshots (
    giveaway_id, giveaway_title, rank, instagram_username, instagram_link, full_name, selected_at
  )
  SELECT g.id, g.title, w.rank, w.instagram_username, w.instagram_link, w.full_name, w.selected_at
  FROM public.giveaways g
  JOIN public.winners w ON w.giveaway_id = g.id
  WHERE g.id = p_giveaway_id
  ON CONFLICT (giveaway_id, rank) DO NOTHING;

  DELETE FROM public.giveaways WHERE id = p_giveaway_id;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_giveaway_preserve_winners(uuid) TO authenticated;

CREATE OR REPLACE VIEW public.winners_public AS
SELECT w.giveaway_id, w.rank, w.instagram_username, w.instagram_link, w.full_name, w.selected_at, g.title AS giveaway_title
FROM public.winners w
JOIN public.giveaways g ON g.id = w.giveaway_id
UNION ALL
SELECT s.giveaway_id, s.rank, s.instagram_username, s.instagram_link, s.full_name, s.selected_at, s.giveaway_title
FROM public.winner_snapshots s;
GRANT SELECT ON public.winners_public TO anon, authenticated;