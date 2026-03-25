-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.drug_interaction_alert_log
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.drug_interaction_alert_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organization(id) on delete set null,
  lane public.care_lane_enum not null,
  owner_patient_id uuid not null references public.patient(id) on delete cascade,
  subject_patient_id uuid not null references public.patient(id) on delete cascade,
  care_profile_bridge_id uuid references public.care_profile_bridge(id) on delete set null,
  consent_grant_id uuid references public.consent_grant(id) on delete set null,
  prescription_id uuid references public.prescription(id) on delete set null,
  prescription_item_id uuid references public.prescription_item(id) on delete set null,
  medication_catalog_a_id uuid references public.medication_catalog(id) on delete set null,
  medication_catalog_b_id uuid references public.medication_catalog(id) on delete set null,
  interaction_rule_id uuid references public.drug_interaction_rule(id) on delete set null,
  severity public.interaction_severity_enum not null,
  alert_summary text not null,
  recommendation text,
  status public.interaction_alert_status_enum not null default 'open',
  acknowledged_by_user_account_id uuid references public.user_account(id) on delete set null,
  acknowledged_at timestamptz,
  overridden_by_user_account_id uuid references public.user_account(id) on delete set null,
  overridden_reason text,
  overridden_at timestamptz,
  created_by_user_account_id uuid references public.user_account(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interaction_alert_summary_nonempty check (length(trim(alert_summary)) > 0),
  constraint interaction_alert_lane_org_check check (
    (lane = 'hospital' and organization_id is not null) or (lane in ('personal', 'family'))
  )
);

