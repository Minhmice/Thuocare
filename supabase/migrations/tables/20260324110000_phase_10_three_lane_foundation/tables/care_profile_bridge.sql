-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.care_profile_bridge
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.care_profile_bridge (
  id uuid primary key default gen_random_uuid(),
  owner_patient_id uuid not null references public.patient(id) on delete cascade,
  subject_patient_id uuid not null references public.patient(id) on delete cascade,
  lane public.care_lane_enum not null,
  organization_id uuid references public.organization(id) on delete set null,
  relationship_type public.relationship_type_enum,
  bridge_note text,
  is_active boolean not null default true,
  created_by_user_account_id uuid references public.user_account(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_profile_bridge_lane_org_check check (
    (lane = 'hospital' and organization_id is not null) or (lane in ('personal', 'family'))
  )
);

create unique index if not exists care_profile_bridge_unique_active
  on public.care_profile_bridge (
    owner_patient_id,
    subject_patient_id,
    lane,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where is_active = true;

