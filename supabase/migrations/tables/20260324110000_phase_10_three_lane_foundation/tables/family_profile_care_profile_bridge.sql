-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.family_profile_care_profile_bridge
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.family_profile_care_profile_bridge (
  family_profile_id uuid not null references public.family_profile(id) on delete cascade,
  shared_care_profile_id uuid not null references public.shared_care_profile(id) on delete cascade,
  granted_by_user_account_id uuid references public.user_account(id) on delete set null,
  grant_reason text,
  is_primary_contact boolean not null default false,
  created_at timestamptz not null default now(),
  constraint family_profile_care_profile_bridge_pk primary key (family_profile_id, shared_care_profile_id),
  constraint family_profile_care_profile_bridge_reason_nonempty
    check (grant_reason is null or length(trim(grant_reason)) > 0)
);

create unique index if not exists fp_care_profile_bridge_one_primary_contact_per_profile
  on public.family_profile_care_profile_bridge (shared_care_profile_id)
  where is_primary_contact = true;

