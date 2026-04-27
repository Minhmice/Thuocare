-- Reminder persistence hardening:
-- - Add updated_at + trigger to dose_occurrences
-- - Add idempotency constraints for taken/skipped events (dose_events)

-- 1) updated_at on dose_occurrences (safe backfill)
ALTER TABLE public.dose_occurrences
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.dose_occurrences
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

ALTER TABLE public.dose_occurrences
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.dose_occurrences
  ALTER COLUMN updated_at SET NOT NULL;

DROP TRIGGER IF EXISTS dose_occurrences_set_updated_at ON public.dose_occurrences;
CREATE TRIGGER dose_occurrences_set_updated_at
  BEFORE UPDATE ON public.dose_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2) Idempotency for events: prevent duplicate taken/skipped for same user+occurrence.
-- Snoozed can happen multiple times, so it is intentionally NOT unique.
CREATE UNIQUE INDEX IF NOT EXISTS dose_events_taken_idempotency_uq
  ON public.dose_events (user_id, occurrence_id)
  WHERE (event_type = 'taken');

CREATE UNIQUE INDEX IF NOT EXISTS dose_events_skipped_idempotency_uq
  ON public.dose_events (user_id, occurrence_id)
  WHERE (event_type = 'skipped');

