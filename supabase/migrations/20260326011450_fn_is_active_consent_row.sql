-- =========================================================
-- Thuocare (split from 20260324110000_phase_10_three_lane_foundation.sql)
-- Function: public.is_active_consent_row(public.consent_grant)
-- =========================================================

begin;

create or replace function public.is_active_consent_row(cg public.consent_grant)
returns boolean
language sql
stable
as $$
  select
    cg.status = 'active'::public.consent_status_enum
    and now() >= coalesce(cg.valid_from, now())
    and (cg.valid_to is null or now() <= cg.valid_to)
    and cg.revoked_at is null
$$;

grant execute on function public.is_active_consent_row(public.consent_grant) to authenticated;

commit;

