-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.consent_grant
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.consent_grant (
  id uuid primary key default gen_random_uuid(),
  grantor_patient_id uuid not null references public.patient(id) on delete cascade,
  subject_patient_id uuid not null references public.patient(id) on delete cascade,
  grantee_type public.consent_grantee_type_enum not null,
  grantee_patient_id uuid references public.patient(id) on delete cascade,
  grantee_organization_id uuid references public.organization(id) on delete cascade,
  lane_from public.care_lane_enum not null,
  lane_to public.care_lane_enum not null,
  purpose text not null default 'care',
  permissions jsonb not null default '{"read": true, "write_alert_log": false}'::jsonb,
  status public.consent_status_enum not null default 'active',
  granted_at timestamptz not null default now(),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  created_by_user_account_id uuid references public.user_account(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consent_grant_grantee_shape_check check (
    (grantee_type = 'patient' and grantee_patient_id is not null and grantee_organization_id is null)
    or (grantee_type = 'organization' and grantee_organization_id is not null and grantee_patient_id is null)
  ),
  constraint consent_grant_valid_range check (valid_to is null or valid_to >= valid_from)
);

