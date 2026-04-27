-- Reminder persistence: meal settings, dose occurrences, dose events

CREATE TABLE public.user_meal_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  timezone text NOT NULL,
  breakfast_time time NOT NULL DEFAULT '08:00',
  lunch_time time NOT NULL DEFAULT '12:00',
  dinner_time time NOT NULL DEFAULT '18:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_meal_settings_set_updated_at ON public.user_meal_settings;
CREATE TRIGGER user_meal_settings_set_updated_at
  BEFORE UPDATE ON public.user_meal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.dose_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_at time NOT NULL,
  window_start_at timestamptz NOT NULL,
  window_end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  taken_at timestamptz,
  snoozed_until timestamptz,
  skipped_at timestamptz,
  skip_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dose_occurrences_status_chk CHECK (
    status IN ('upcoming', 'taken', 'snoozed', 'skipped', 'missed')
  ),
  CONSTRAINT dose_occurrences_window_order_chk CHECK (
    window_end_at >= window_start_at
  ),
  CONSTRAINT dose_occurrences_user_date_time_uq UNIQUE (user_id, scheduled_date, scheduled_at),
  CONSTRAINT dose_occurrences_id_user_uq UNIQUE (id, user_id)
);

CREATE TABLE public.dose_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  occurrence_id uuid NOT NULL,
  event_type text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb,
  CONSTRAINT dose_events_occurrence_user_fk FOREIGN KEY (occurrence_id, user_id)
    REFERENCES public.dose_occurrences (id, user_id) ON DELETE CASCADE,
  CONSTRAINT dose_events_event_type_chk CHECK (
    event_type IN ('created', 'taken', 'snoozed', 'skipped', 'missed', 'status_changed', 'note')
  )
);

CREATE INDEX dose_occurrences_user_date_idx ON public.dose_occurrences (user_id, scheduled_date);
CREATE INDEX dose_occurrences_user_window_start_idx ON public.dose_occurrences (user_id, window_start_at);
CREATE INDEX dose_events_occurrence_event_at_idx ON public.dose_events (occurrence_id, event_at DESC);
CREATE INDEX dose_events_user_event_at_idx ON public.dose_events (user_id, event_at DESC);

ALTER TABLE public.user_meal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_meal_settings_select_own
  ON public.user_meal_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_meal_settings_insert_own
  ON public.user_meal_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_meal_settings_update_own
  ON public.user_meal_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_meal_settings_delete_own
  ON public.user_meal_settings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY dose_occurrences_select_own
  ON public.dose_occurrences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY dose_occurrences_insert_own
  ON public.dose_occurrences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY dose_occurrences_update_own
  ON public.dose_occurrences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY dose_occurrences_delete_own
  ON public.dose_occurrences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY dose_events_select_own
  ON public.dose_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY dose_events_insert_own
  ON public.dose_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

