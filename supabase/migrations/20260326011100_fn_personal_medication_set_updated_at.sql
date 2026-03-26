-- =========================================================
-- Thuocare (split from 20260325000000_phase_11_personal_lane_tables.sql)
-- Function: public.personal_medication_set_updated_at()
-- =========================================================

begin;

create or replace function public.personal_medication_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

commit;

