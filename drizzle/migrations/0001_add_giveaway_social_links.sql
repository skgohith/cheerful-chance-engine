ALTER TABLE public.giveaways
  ADD COLUMN instagram_url text,
  ADD COLUMN telegram_url text,
  ADD COLUMN youtube_url text,
  ADD COLUMN facebook_url text;

CREATE OR REPLACE VIEW public.giveaways_public AS
SELECT
  g.id, g.title, g.description, g.image_url, g.start_date, g.end_date,
  g.winner_limit, g.status, g.created_at,
  (SELECT count(*) FROM public.participants p WHERE p.giveaway_id = g.id) AS participant_count,
  g.instagram_url, g.telegram_url, g.youtube_url, g.facebook_url
FROM public.giveaways g
WHERE g.status IN ('active', 'completed', 'data_cleared');

GRANT SELECT ON public.giveaways_public TO anon, authenticated;