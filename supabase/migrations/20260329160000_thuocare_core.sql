-- Thuocare: profiles + medications, auth-only RLS, signup → profile. No demo tenant, no seed data.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.scheduled_doses CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  profile_slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  timezone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  onboarding_completed boolean NOT NULL DEFAULT false,
  onboarding_survey jsonb,
  reminder_preference text,
  routine_stage text,
  routine_segment text,
  CONSTRAINT profiles_reminder_preference_chk CHECK (
    reminder_preference IS NULL OR reminder_preference IN ('quiet', 'balanced', 'firm')
  ),
  CONSTRAINT profiles_routine_stage_chk CHECK (
    routine_stage IS NULL OR routine_stage IN ('starting', 'steady', 'resetting')
  ),
  CONSTRAINT profiles_routine_segment_chk CHECK (
    routine_segment IS NULL OR routine_segment IN (
      'uncertain-start', 'high-support', 'light-routine', 'structured-routine'
    )
  )
);

CREATE TABLE public.medications (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  schedule text NOT NULL,
  remaining_doses integer,
  instruction text NOT NULL DEFAULT '',
  scheduled_at text NOT NULL DEFAULT '08:00',
  period text NOT NULL DEFAULT 'morning',
  dose_status text NOT NULL DEFAULT 'upcoming',
  taken_at text,
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT medications_period_chk CHECK (
    period IN ('morning', 'afternoon', 'evening', 'night')
  ),
  CONSTRAINT medications_dose_status_chk CHECK (
    dose_status IN ('taken', 'missed', 'upcoming')
  )
);

CREATE INDEX medications_user_id_idx ON public.medications (user_id);
CREATE INDEX medications_user_date_idx ON public.medications (user_id, scheduled_date);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY medications_select_own
  ON public.medications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY medications_insert_own
  ON public.medications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY medications_update_own
  ON public.medications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY medications_delete_own
  ON public.medications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  meta_phone text;
BEGIN
  base_slug := 'u' || replace(new.id::text, '-', '');
  meta_phone := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'phone_number'
      )
    ),
    ''
  );
  INSERT INTO public.profiles (user_id, profile_slug, full_name, email, phone, timezone, onboarding_completed)
  VALUES (
    new.id,
    base_slug,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Thuocare user'),
    coalesce(nullif(trim(new.email), ''), ''),
    meta_phone,
    coalesce(nullif(trim(new.raw_user_meta_data->>'timezone'), ''), 'Asia/Ho_Chi_Minh'),
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
