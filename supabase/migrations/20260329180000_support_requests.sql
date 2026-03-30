-- In-app support pings from Me tab: one row per tap (or future form submit).

CREATE TABLE public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'me_support_cta',
  body text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_requests_status_chk CHECK (
    status IN ('new', 'read', 'closed')
  )
);

CREATE INDEX support_requests_user_id_created_at_idx
  ON public.support_requests (user_id, created_at DESC);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_requests_select_own
  ON public.support_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY support_requests_insert_own
  ON public.support_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
