-- Replace support_requests with in-app feedback (rating, category, problem text, optional screenshot).
-- Screenshots live in Storage bucket feedback-screenshots (private).

DROP TABLE IF EXISTS public.support_requests CASCADE;
DROP TABLE IF EXISTS public.app_feedback CASCADE;

CREATE TABLE public.app_feedback (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  category text NOT NULL,
  problem_description text NOT NULL,
  screenshot_storage_path text,
  source text NOT NULL DEFAULT 'me_feedback',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_feedback_rating_chk CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT app_feedback_category_chk CHECK (
    category IN ('bug', 'ui_ux', 'medications', 'account', 'performance', 'other')
  )
);

CREATE INDEX app_feedback_user_id_created_at_idx
  ON public.app_feedback (user_id, created_at DESC);

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_feedback_select_own
  ON public.app_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY app_feedback_insert_own
  ON public.app_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS feedback_screenshots_insert_own ON storage.objects;
DROP POLICY IF EXISTS feedback_screenshots_select_own ON storage.objects;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY feedback_screenshots_insert_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY feedback_screenshots_select_own
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'feedback-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
