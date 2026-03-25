-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.family_profile
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.family_profile (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  relationship_type public.relationship_type_enum not null default 'other',
  access_role public.family_access_role_enum not null default 'caregiver',
  can_receive_notifications boolean not null default true,
  profile_status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_profile_full_name_nonempty check (length(trim(full_name)) > 0)
);

create unique index if not exists family_profile_auth_user_id_unique
  on public.family_profile (auth_user_id)
  where auth_user_id is not null;

create index if not exists family_profile_patient_status_idx
  on public.family_profile (patient_id, profile_status);

