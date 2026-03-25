-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.follow_up_plan
-- Note: canonical execution order still lives in the original migration file.
create table public.follow_up_plan (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  patient_id uuid not null references public.patient(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  source_prescription_id uuid references public.prescription(id) on delete set null,
  owner_doctor_id uuid references public.doctor_profile(id) on delete set null,
  follow_up_type public.follow_up_type_enum not null,
  trigger_mode public.follow_up_trigger_mode_enum not null,
  due_at timestamptz,
  due_window_start_at timestamptz,
  due_window_end_at timestamptz,
  required_before_refill boolean not null default false,
  instruction_text text,
  status public.follow_up_status_enum not null default 'planned',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_up_due_window_valid
    check (
      due_window_start_at is null
      or due_window_end_at is null
      or due_window_end_at >= due_window_start_at
    ),
  constraint follow_up_completed_at_logic
    check (
      (status <> 'completed')
      or completed_at is not null
    )
);

