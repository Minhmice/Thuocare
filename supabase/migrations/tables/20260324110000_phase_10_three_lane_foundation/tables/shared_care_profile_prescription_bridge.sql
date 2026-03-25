-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.shared_care_profile_prescription_bridge
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.shared_care_profile_prescription_bridge (
  shared_care_profile_id uuid not null references public.shared_care_profile(id) on delete cascade,
  prescription_id uuid not null references public.prescription(id) on delete cascade,
  linked_by_user_account_id uuid references public.user_account(id) on delete set null,
  link_note text,
  created_at timestamptz not null default now(),
  constraint shared_care_profile_prescription_bridge_pk
    primary key (shared_care_profile_id, prescription_id),
  constraint shared_care_profile_prescription_bridge_note_nonempty
    check (link_note is null or length(trim(link_note)) > 0)
);

