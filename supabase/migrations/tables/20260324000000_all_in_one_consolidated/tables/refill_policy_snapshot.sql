-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.refill_policy_snapshot
-- Note: canonical execution order still lives in the original migration file.
create table public.refill_policy_snapshot (
  id uuid primary key default gen_random_uuid(),
  prescription_item_id uuid not null unique references public.prescription_item(id) on delete cascade,
  refill_mode public.refill_mode_enum not null,
  max_refills_allowed integer not null default 0,
  min_days_between_refills integer,
  earliest_refill_ratio numeric(5,4),
  review_required_after_date date,
  absolute_expiry_date date,
  late_refill_escalation_after_days integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refill_policy_max_refills_nonnegative check (max_refills_allowed >= 0),
  constraint refill_policy_min_days_positive
    check (min_days_between_refills is null or min_days_between_refills > 0),
  constraint refill_policy_ratio_between_0_1
    check (earliest_refill_ratio is null or (earliest_refill_ratio >= 0 and earliest_refill_ratio <= 1)),
  constraint refill_policy_escalation_days_nonnegative
    check (late_refill_escalation_after_days is null or late_refill_escalation_after_days >= 0),
  constraint refill_policy_absolute_expiry_gte_review_date
    check (
      absolute_expiry_date is null
      or review_required_after_date is null
      or absolute_expiry_date >= review_required_after_date
    )
);

