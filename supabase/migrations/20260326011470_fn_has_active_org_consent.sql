-- =========================================================
-- Thuocare (split from 20260324110000_phase_10_three_lane_foundation.sql)
-- Function: public.has_active_org_consent(uuid, uuid, uuid, text)
-- =========================================================

begin;

create or replace function public.has_active_org_consent(
  grantor_patient uuid,
  subject_patient uuid,
  grantee_org uuid,
  required_permission text default 'read'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.consent_grant cg
    where cg.grantor_patient_id = grantor_patient
      and cg.subject_patient_id = subject_patient
      and cg.grantee_type = 'organization'::public.consent_grantee_type_enum
      and cg.grantee_organization_id = grantee_org
      and public.is_active_consent_row(cg)
      and coalesce((cg.permissions ->> required_permission)::boolean, false)
  )
$$;

grant execute on function public.has_active_org_consent(uuid, uuid, uuid, text) to authenticated;

commit;

