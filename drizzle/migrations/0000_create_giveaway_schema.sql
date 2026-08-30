CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE TABLE public.giveaways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  winner_limit integer NOT NULL DEFAULT 1 CHECK (winner_limit BETWEEN 1 AND 10),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed', 'data_cleared')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.giveaways TO authenticated;
GRANT ALL ON public.giveaways TO service_role;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage giveaways" ON public.giveaways
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  instagram_username text NOT NULL,
  instagram_username_normalized text NOT NULL,
  instagram_link text NOT NULL,
  email text,
  phone text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (giveaway_id, instagram_username_normalized)
);
GRANT SELECT, UPDATE, DELETE ON public.participants TO authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage participants" ON public.participants
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  rank integer NOT NULL CHECK (rank BETWEEN 1 AND 10),
  instagram_username text NOT NULL,
  instagram_link text NOT NULL,
  full_name text NOT NULL,
  selected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (giveaway_id, rank),
  UNIQUE (giveaway_id, instagram_username)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.winners TO authenticated;
GRANT ALL ON public.winners TO service_role;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage winners" ON public.winners
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX giveaways_status_end_date_idx ON public.giveaways(status, end_date);
CREATE INDEX participants_giveaway_created_idx ON public.participants(giveaway_id, created_at DESC);
CREATE INDEX participants_rate_limit_idx ON public.participants(giveaway_id, ip_hash, created_at DESC);
CREATE INDEX winners_giveaway_rank_idx ON public.winners(giveaway_id, rank);

CREATE OR REPLACE FUNCTION public.set_giveaways_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER giveaways_set_updated_at
  BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.set_giveaways_updated_at();

CREATE OR REPLACE FUNCTION public.validate_giveaway_dates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.start_date >= NEW.end_date THEN
    RAISE EXCEPTION 'Giveaway end date must be after the start date';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER giveaways_validate_dates
  BEFORE INSERT OR UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.validate_giveaway_dates();

CREATE OR REPLACE FUNCTION public.submit_participant(
  p_giveaway_id uuid,
  p_full_name text,
  p_instagram_username text,
  p_instagram_username_normalized text,
  p_instagram_link text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_honeypot text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  giveaway_row public.giveaways%ROWTYPE;
  participant_id uuid;
BEGIN
  IF coalesce(p_honeypot, '') <> '' THEN
    RAISE EXCEPTION 'Unable to submit entry';
  END IF;

  IF length(trim(coalesce(p_full_name, ''))) < 2 OR length(p_full_name) > 120 THEN
    RAISE EXCEPTION 'Please enter a valid name';
  END IF;
  IF length(trim(coalesce(p_instagram_username, ''))) < 2 OR length(p_instagram_username) > 120 THEN
    RAISE EXCEPTION 'Please enter a valid Instagram username';
  END IF;
  IF length(trim(coalesce(p_instagram_link, ''))) < 15 OR length(p_instagram_link) > 300 THEN
    RAISE EXCEPTION 'Please enter a valid Instagram profile link';
  END IF;

  SELECT * INTO giveaway_row FROM public.giveaways WHERE id = p_giveaway_id;
  IF giveaway_row.id IS NULL OR giveaway_row.status <> 'active' OR now() < giveaway_row.start_date OR now() >= giveaway_row.end_date THEN
    RAISE EXCEPTION 'This giveaway is no longer accepting entries';
  END IF;

  IF p_ip_hash IS NOT NULL AND (
    SELECT count(*) FROM public.participants
    WHERE giveaway_id = p_giveaway_id AND ip_hash = p_ip_hash AND created_at > now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.participants
    WHERE giveaway_id = p_giveaway_id AND instagram_username_normalized = lower(trim(p_instagram_username_normalized))
  ) THEN
    RAISE EXCEPTION 'This Instagram account has already entered';
  END IF;

  INSERT INTO public.participants (
    giveaway_id, full_name, instagram_username, instagram_username_normalized,
    instagram_link, email, phone, ip_hash
  ) VALUES (
    p_giveaway_id, trim(p_full_name), trim(p_instagram_username), lower(trim(p_instagram_username_normalized)),
    trim(p_instagram_link), nullif(trim(p_email), ''), nullif(trim(p_phone), ''), p_ip_hash
  ) RETURNING id INTO participant_id;

  RETURN participant_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_participant(uuid, text, text, text, text, text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_participant_count(p_giveaway_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.participants WHERE giveaway_id = p_giveaway_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_participant_count(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.pick_giveaway_winners(p_giveaway_id uuid)
RETURNS SETOF public.winners
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  giveaway_row public.giveaways%ROWTYPE;
  selected_participant record;
  selected_rank integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO giveaway_row FROM public.giveaways WHERE id = p_giveaway_id FOR UPDATE;
  IF giveaway_row.id IS NULL THEN
    RAISE EXCEPTION 'Giveaway not found';
  END IF;

  DELETE FROM public.winners WHERE giveaway_id = p_giveaway_id;

  FOR selected_participant IN
    SELECT full_name, instagram_username, instagram_link
    FROM public.participants
    WHERE giveaway_id = p_giveaway_id
    ORDER BY random()
    LIMIT giveaway_row.winner_limit
  LOOP
    selected_rank := selected_rank + 1;
    INSERT INTO public.winners (giveaway_id, rank, instagram_username, instagram_link, full_name)
    VALUES (p_giveaway_id, selected_rank, selected_participant.instagram_username, selected_participant.instagram_link, selected_participant.full_name);
  END LOOP;

  IF selected_rank < giveaway_row.winner_limit THEN
    RAISE EXCEPTION 'Not enough valid entries to select all winners';
  END IF;

  UPDATE public.giveaways SET status = 'completed' WHERE id = p_giveaway_id;
  RETURN QUERY SELECT * FROM public.winners WHERE giveaway_id = p_giveaway_id ORDER BY rank;
END;
$$;
GRANT EXECUTE ON FUNCTION public.pick_giveaway_winners(uuid) TO authenticated;

CREATE VIEW public.giveaways_public AS
SELECT
  g.id, g.title, g.description, g.image_url, g.start_date, g.end_date,
  g.winner_limit, g.status, g.created_at,
  (SELECT count(*) FROM public.participants p WHERE p.giveaway_id = g.id) AS participant_count
FROM public.giveaways g
WHERE g.status IN ('active', 'completed', 'data_cleared');
GRANT SELECT ON public.giveaways_public TO anon, authenticated;

CREATE VIEW public.winners_public AS
SELECT giveaway_id, rank, instagram_username, instagram_link, full_name, selected_at
FROM public.winners;
GRANT SELECT ON public.winners_public TO anon, authenticated;