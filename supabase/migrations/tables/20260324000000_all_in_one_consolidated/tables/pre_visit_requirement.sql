-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.pre_visit_requirement
-- Note: canonical execution order still lives in the original migration file.
create table public.pre_visit_requirement (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointment(id) on delete cascade,
  requirement_type public.pre_visit_requirement_type_enum not null,
  instruction_text text not null,
  status public.pre_visit_requirement_status_enum not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pre_visit_instruction_nonempty check (length(trim(instruction_text)) > 0)
);

