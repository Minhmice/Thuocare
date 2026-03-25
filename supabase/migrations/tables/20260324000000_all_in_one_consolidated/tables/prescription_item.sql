-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.prescription_item
-- Note: canonical execution order still lives in the original migration file.
create table public.prescription_item (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescription(id) on delete cascade,
  line_no integer not null,
  medication_master_id uuid not null references public.medication_master(id) on delete restrict,
  indication_text text,
  dose_amount numeric(12,4) not null,
  dose_unit text not null,
  route public.route_enum not null,
  frequency_code text,
  frequency_text text not null,
  timing_relation public.timing_relation_enum not null default 'none',
  administration_instruction_text text not null,
  patient_instruction_text text not null,
  prn_flag boolean not null default false,
  prn_reason text,
  quantity_prescribed numeric(12,4) not null,
  quantity_unit text not null,
  days_supply integer not null,
  start_date date not null,
  end_date date,
  is_refillable boolean not null default false,
  max_refills_allowed integer not null default 0,
  requires_review_before_refill boolean not null default false,
  high_risk_review_flag boolean not null default false,
  status public.prescription_item_status_enum not null default 'active',
  stop_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prescription_item_line_unique unique (prescription_id, line_no),
  constraint prescription_item_line_no_positive check (line_no > 0),
  constraint prescription_item_dose_amount_positive check (dose_amount > 0),
  constraint prescription_item_dose_unit_nonempty check (length(trim(dose_unit)) > 0),
  constraint prescription_item_frequency_text_nonempty check (length(trim(frequency_text)) > 0),
  constraint prescription_item_admin_instruction_nonempty
    check (length(trim(administration_instruction_text)) > 0),
  constraint prescription_item_patient_instruction_nonempty
    check (length(trim(patient_instruction_text)) > 0),
  constraint prescription_item_quantity_positive check (quantity_prescribed > 0),
  constraint prescription_item_quantity_unit_nonempty check (length(trim(quantity_unit)) > 0),
  constraint prescription_item_days_supply_positive check (days_supply > 0),
  constraint prescription_item_end_date_gte_start
    check (end_date is null or end_date >= start_date),
  constraint prescription_item_max_refills_nonnegative check (max_refills_allowed >= 0),
  constraint prescription_item_prn_reason_when_prn
    check ((prn_flag = false) or (prn_reason is not null and length(trim(prn_reason)) > 0))
);

