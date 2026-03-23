-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 1 / Lifecycle Core
-- Supabase RLS + helper auth bridge
--
-- Assumptions:
-- 1) Staff users authenticate with auth.users and map to public.user_account.auth_user_id.
-- 2) Patients authenticate with auth.users and map to public.patient.auth_user_id.
-- 3) Caregiver direct login is not modeled yet in this baseline.
-- 4) service_role bypasses RLS as usual in Supabase.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Auth bridge columns
-- ---------------------------------------------------------

alter table public.user_account
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

alter table public.patient
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists user_account_auth_user_id_unique
  on public.user_account (auth_user_id)
  where auth_user_id is not null;

create unique index if not exists patient_auth_user_id_unique
  on public.patient (auth_user_id)
  where auth_user_id is not null;

comment on column public.user_account.auth_user_id is 'Links staff account to auth.users.id for Supabase RLS.';
comment on column public.patient.auth_user_id is 'Links patient account to auth.users.id for Supabase RLS.';

-- ---------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------

create or replace function public.current_staff_user_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ua.id
  from public.user_account ua
  where ua.auth_user_id = auth.uid()
    and ua.status = 'active'
  limit 1
$$;

create or replace function public.current_staff_role()
returns public.user_role_enum
language sql
stable
security definer
set search_path = public
as $$
  select ua.role
  from public.user_account ua
  where ua.auth_user_id = auth.uid()
    and ua.status = 'active'
  limit 1
$$;

create or replace function public.current_doctor_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select dp.id
  from public.doctor_profile dp
  join public.user_account ua on ua.id = dp.user_account_id
  where ua.auth_user_id = auth.uid()
    and ua.status = 'active'
    and dp.status = 'active'
  limit 1
$$;

create or replace function public.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.patient p
  where p.auth_user_id = auth.uid()
    and p.status = 'active'
  limit 1
$$;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select x.organization_id
  from (
    select ua.organization_id, 1 as priority
    from public.user_account ua
    where ua.auth_user_id = auth.uid()
      and ua.status = 'active'

    union all

    select p.organization_id, 2 as priority
    from public.patient p
    where p.auth_user_id = auth.uid()
      and p.status = 'active'
  ) x
  order by x.priority
  limit 1
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_user_account_id() is not null
$$;

create or replace function public.is_patient_actor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_patient_id() is not null
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'admin'::public.user_role_enum
$$;

create or replace function public.is_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'doctor'::public.user_role_enum
$$;

create or replace function public.is_nurse()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'nurse'::public.user_role_enum
$$;

create or replace function public.is_pharmacist()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'pharmacist'::public.user_role_enum
$$;

create or replace function public.is_care_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'care_coordinator'::public.user_role_enum
$$;

create or replace function public.can_write_clinical_data()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'doctor'::public.user_role_enum,
    'nurse'::public.user_role_enum,
    'care_coordinator'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

create or replace function public.can_write_prescriptions()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'doctor'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

create or replace function public.can_manage_refills()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'doctor'::public.user_role_enum,
    'nurse'::public.user_role_enum,
    'pharmacist'::public.user_role_enum,
    'care_coordinator'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

create or replace function public.can_manage_medication_catalog()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'pharmacist'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

create or replace function public.belongs_to_current_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_org_id = public.current_organization_id()
$$;

create or replace function public.is_current_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_patient_id = public.current_patient_id()
$$;

create or replace function public.patient_belongs_to_current_org(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient p
    where p.id = target_patient_id
      and p.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.episode_belongs_to_current_org(target_episode_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.treatment_episode te
    where te.id = target_episode_id
      and te.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.encounter_belongs_to_current_org(target_encounter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.encounter e
    where e.id = target_encounter_id
      and e.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.prescription_belongs_to_current_org(target_prescription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prescription p
    where p.id = target_prescription_id
      and p.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.prescription_item_belongs_to_current_org(target_prescription_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prescription_item pi
    join public.prescription p on p.id = pi.prescription_id
    where pi.id = target_prescription_item_id
      and p.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.follow_up_belongs_to_current_org(target_follow_up_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.follow_up_plan fup
    where fup.id = target_follow_up_plan_id
      and fup.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.appointment_belongs_to_current_org(target_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointment a
    where a.id = target_appointment_id
      and a.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.refill_request_belongs_to_current_org(target_refill_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.refill_request rr
    where rr.id = target_refill_request_id
      and rr.organization_id = public.current_organization_id()
  )
$$;

grant execute on function public.current_staff_user_account_id() to authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.current_doctor_profile_id() to authenticated;
grant execute on function public.current_patient_id() to authenticated;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_patient_actor() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_doctor() to authenticated;
grant execute on function public.is_nurse() to authenticated;
grant execute on function public.is_pharmacist() to authenticated;
grant execute on function public.is_care_coordinator() to authenticated;
grant execute on function public.can_write_clinical_data() to authenticated;
grant execute on function public.can_write_prescriptions() to authenticated;
grant execute on function public.can_manage_refills() to authenticated;
grant execute on function public.can_manage_medication_catalog() to authenticated;
grant execute on function public.belongs_to_current_org(uuid) to authenticated;
grant execute on function public.is_current_patient(uuid) to authenticated;
grant execute on function public.patient_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.episode_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.encounter_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.prescription_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.prescription_item_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.follow_up_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.appointment_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.refill_request_belongs_to_current_org(uuid) to authenticated;

-- ---------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on all tables in schema public to authenticated;

-- ---------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------

alter table public.organization enable row level security;
alter table public.clinic enable row level security;
alter table public.user_account enable row level security;
alter table public.doctor_profile enable row level security;
alter table public.patient enable row level security;
alter table public.caregiver_link enable row level security;
alter table public.treatment_episode enable row level security;
alter table public.encounter enable row level security;
alter table public.diagnosis enable row level security;
alter table public.medication_master enable row level security;
alter table public.prescription enable row level security;
alter table public.prescription_item enable row level security;
alter table public.dose_schedule enable row level security;
alter table public.refill_policy_snapshot enable row level security;
alter table public.follow_up_plan enable row level security;
alter table public.appointment enable row level security;
alter table public.pre_visit_requirement enable row level security;
alter table public.refill_request enable row level security;
alter table public.refill_request_item enable row level security;
alter table public.treatment_event enable row level security;

-- ---------------------------------------------------------
-- organization
-- ---------------------------------------------------------

drop policy if exists organization_staff_select_own_org on public.organization;
create policy organization_staff_select_own_org
on public.organization
for select
using (public.is_staff() and public.belongs_to_current_org(id));

drop policy if exists organization_admin_update_own_org on public.organization;
create policy organization_admin_update_own_org
on public.organization
for update
using (public.is_admin() and public.belongs_to_current_org(id))
with check (public.is_admin() and public.belongs_to_current_org(id));

-- ---------------------------------------------------------
-- clinic
-- ---------------------------------------------------------

drop policy if exists clinic_staff_select_same_org on public.clinic;
create policy clinic_staff_select_same_org
on public.clinic
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists clinic_admin_manage_same_org on public.clinic;
create policy clinic_admin_manage_same_org
on public.clinic
for all
using (public.is_admin() and public.belongs_to_current_org(organization_id))
with check (public.is_admin() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- user_account
-- ---------------------------------------------------------

drop policy if exists user_account_staff_select_same_org on public.user_account;
create policy user_account_staff_select_same_org
on public.user_account
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists user_account_self_select on public.user_account;
create policy user_account_self_select
on public.user_account
for select
using (auth.uid() = auth_user_id);

drop policy if exists user_account_admin_manage_same_org on public.user_account;
create policy user_account_admin_manage_same_org
on public.user_account
for all
using (public.is_admin() and public.belongs_to_current_org(organization_id))
with check (public.is_admin() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- doctor_profile
-- ---------------------------------------------------------

drop policy if exists doctor_profile_staff_select_same_org on public.doctor_profile;
create policy doctor_profile_staff_select_same_org
on public.doctor_profile
for select
using (
  public.is_staff()
  and exists (
    select 1
    from public.user_account ua
    where ua.id = user_account_id
      and ua.organization_id = public.current_organization_id()
  )
);

drop policy if exists doctor_profile_self_select on public.doctor_profile;
create policy doctor_profile_self_select
on public.doctor_profile
for select
using (
  exists (
    select 1
    from public.user_account ua
    where ua.id = user_account_id
      and ua.auth_user_id = auth.uid()
  )
);

drop policy if exists doctor_profile_admin_manage_same_org on public.doctor_profile;
create policy doctor_profile_admin_manage_same_org
on public.doctor_profile
for all
using (
  public.is_admin()
  and exists (
    select 1
    from public.user_account ua
    where ua.id = user_account_id
      and ua.organization_id = public.current_organization_id()
  )
)
with check (
  public.is_admin()
  and exists (
    select 1
    from public.user_account ua
    where ua.id = user_account_id
      and ua.organization_id = public.current_organization_id()
  )
);

-- ---------------------------------------------------------
-- patient
-- ---------------------------------------------------------

drop policy if exists patient_staff_select_same_org on public.patient;
create policy patient_staff_select_same_org
on public.patient
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists patient_self_select on public.patient;
create policy patient_self_select
on public.patient
for select
using (auth.uid() = auth_user_id);

drop policy if exists patient_staff_insert_same_org on public.patient;
create policy patient_staff_insert_same_org
on public.patient
for insert
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

drop policy if exists patient_staff_update_same_org on public.patient;
create policy patient_staff_update_same_org
on public.patient
for update
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- caregiver_link
-- ---------------------------------------------------------

drop policy if exists caregiver_link_staff_select_same_org on public.caregiver_link;
create policy caregiver_link_staff_select_same_org
on public.caregiver_link
for select
using (public.is_staff() and public.patient_belongs_to_current_org(patient_id));

drop policy if exists caregiver_link_patient_select_own on public.caregiver_link;
create policy caregiver_link_patient_select_own
on public.caregiver_link
for select
using (public.is_current_patient(patient_id));

drop policy if exists caregiver_link_staff_manage_same_org on public.caregiver_link;
create policy caregiver_link_staff_manage_same_org
on public.caregiver_link
for all
using (public.can_write_clinical_data() and public.patient_belongs_to_current_org(patient_id))
with check (public.can_write_clinical_data() and public.patient_belongs_to_current_org(patient_id));

-- ---------------------------------------------------------
-- treatment_episode
-- ---------------------------------------------------------

drop policy if exists treatment_episode_staff_select_same_org on public.treatment_episode;
create policy treatment_episode_staff_select_same_org
on public.treatment_episode
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists treatment_episode_patient_select_own on public.treatment_episode;
create policy treatment_episode_patient_select_own
on public.treatment_episode
for select
using (public.is_current_patient(patient_id));

drop policy if exists treatment_episode_staff_manage_same_org on public.treatment_episode;
create policy treatment_episode_staff_manage_same_org
on public.treatment_episode
for all
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- encounter
-- ---------------------------------------------------------

drop policy if exists encounter_staff_select_same_org on public.encounter;
create policy encounter_staff_select_same_org
on public.encounter
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists encounter_patient_select_own on public.encounter;
create policy encounter_patient_select_own
on public.encounter
for select
using (public.is_current_patient(patient_id));

drop policy if exists encounter_staff_manage_same_org on public.encounter;
create policy encounter_staff_manage_same_org
on public.encounter
for all
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- diagnosis
-- ---------------------------------------------------------

drop policy if exists diagnosis_staff_select_same_org on public.diagnosis;
create policy diagnosis_staff_select_same_org
on public.diagnosis
for select
using (public.is_staff() and public.episode_belongs_to_current_org(treatment_episode_id));

drop policy if exists diagnosis_patient_select_own on public.diagnosis;
create policy diagnosis_patient_select_own
on public.diagnosis
for select
using (
  exists (
    select 1
    from public.treatment_episode te
    where te.id = treatment_episode_id
      and te.patient_id = public.current_patient_id()
  )
);

drop policy if exists diagnosis_staff_manage_same_org on public.diagnosis;
create policy diagnosis_staff_manage_same_org
on public.diagnosis
for all
using (public.can_write_clinical_data() and public.episode_belongs_to_current_org(treatment_episode_id))
with check (public.can_write_clinical_data() and public.episode_belongs_to_current_org(treatment_episode_id));

-- ---------------------------------------------------------
-- medication_master
-- ---------------------------------------------------------

drop policy if exists medication_master_staff_select on public.medication_master;
create policy medication_master_staff_select
on public.medication_master
for select
using (public.is_staff());

drop policy if exists medication_master_catalog_manage on public.medication_master;
create policy medication_master_catalog_manage
on public.medication_master
for all
using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

-- ---------------------------------------------------------
-- prescription
-- ---------------------------------------------------------

drop policy if exists prescription_staff_select_same_org on public.prescription;
create policy prescription_staff_select_same_org
on public.prescription
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists prescription_patient_select_own on public.prescription;
create policy prescription_patient_select_own
on public.prescription
for select
using (public.is_current_patient(patient_id));

drop policy if exists prescription_staff_manage_same_org on public.prescription;
create policy prescription_staff_manage_same_org
on public.prescription
for all
using (public.can_write_prescriptions() and public.belongs_to_current_org(organization_id))
with check (public.can_write_prescriptions() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- prescription_item
-- ---------------------------------------------------------

drop policy if exists prescription_item_staff_select_same_org on public.prescription_item;
create policy prescription_item_staff_select_same_org
on public.prescription_item
for select
using (public.is_staff() and public.prescription_belongs_to_current_org(prescription_id));

drop policy if exists prescription_item_patient_select_own on public.prescription_item;
create policy prescription_item_patient_select_own
on public.prescription_item
for select
using (
  exists (
    select 1
    from public.prescription p
    where p.id = prescription_id
      and p.patient_id = public.current_patient_id()
  )
);

drop policy if exists prescription_item_staff_manage_same_org on public.prescription_item;
create policy prescription_item_staff_manage_same_org
on public.prescription_item
for all
using (public.can_write_prescriptions() and public.prescription_belongs_to_current_org(prescription_id))
with check (public.can_write_prescriptions() and public.prescription_belongs_to_current_org(prescription_id));

-- ---------------------------------------------------------
-- dose_schedule
-- ---------------------------------------------------------

drop policy if exists dose_schedule_staff_select_same_org on public.dose_schedule;
create policy dose_schedule_staff_select_same_org
on public.dose_schedule
for select
using (public.is_staff() and public.prescription_item_belongs_to_current_org(prescription_item_id));

drop policy if exists dose_schedule_patient_select_own on public.dose_schedule;
create policy dose_schedule_patient_select_own
on public.dose_schedule
for select
using (
  exists (
    select 1
    from public.prescription_item pi
    join public.prescription p on p.id = pi.prescription_id
    where pi.id = prescription_item_id
      and p.patient_id = public.current_patient_id()
  )
);

drop policy if exists dose_schedule_staff_manage_same_org on public.dose_schedule;
create policy dose_schedule_staff_manage_same_org
on public.dose_schedule
for all
using (public.can_write_prescriptions() and public.prescription_item_belongs_to_current_org(prescription_item_id))
with check (public.can_write_prescriptions() and public.prescription_item_belongs_to_current_org(prescription_item_id));

-- ---------------------------------------------------------
-- refill_policy_snapshot
-- ---------------------------------------------------------

drop policy if exists refill_policy_snapshot_staff_select_same_org on public.refill_policy_snapshot;
create policy refill_policy_snapshot_staff_select_same_org
on public.refill_policy_snapshot
for select
using (public.is_staff() and public.prescription_item_belongs_to_current_org(prescription_item_id));

drop policy if exists refill_policy_snapshot_patient_select_own on public.refill_policy_snapshot;
create policy refill_policy_snapshot_patient_select_own
on public.refill_policy_snapshot
for select
using (
  exists (
    select 1
    from public.prescription_item pi
    join public.prescription p on p.id = pi.prescription_id
    where pi.id = prescription_item_id
      and p.patient_id = public.current_patient_id()
  )
);

drop policy if exists refill_policy_snapshot_staff_manage_same_org on public.refill_policy_snapshot;
create policy refill_policy_snapshot_staff_manage_same_org
on public.refill_policy_snapshot
for all
using (public.can_write_prescriptions() and public.prescription_item_belongs_to_current_org(prescription_item_id))
with check (public.can_write_prescriptions() and public.prescription_item_belongs_to_current_org(prescription_item_id));

-- ---------------------------------------------------------
-- follow_up_plan
-- ---------------------------------------------------------

drop policy if exists follow_up_plan_staff_select_same_org on public.follow_up_plan;
create policy follow_up_plan_staff_select_same_org
on public.follow_up_plan
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists follow_up_plan_patient_select_own on public.follow_up_plan;
create policy follow_up_plan_patient_select_own
on public.follow_up_plan
for select
using (public.is_current_patient(patient_id));

drop policy if exists follow_up_plan_staff_manage_same_org on public.follow_up_plan;
create policy follow_up_plan_staff_manage_same_org
on public.follow_up_plan
for all
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- appointment
-- ---------------------------------------------------------

drop policy if exists appointment_staff_select_same_org on public.appointment;
create policy appointment_staff_select_same_org
on public.appointment
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists appointment_patient_select_own on public.appointment;
create policy appointment_patient_select_own
on public.appointment
for select
using (public.is_current_patient(patient_id));

drop policy if exists appointment_staff_manage_same_org on public.appointment;
create policy appointment_staff_manage_same_org
on public.appointment
for all
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- pre_visit_requirement
-- ---------------------------------------------------------

drop policy if exists pre_visit_requirement_staff_select_same_org on public.pre_visit_requirement;
create policy pre_visit_requirement_staff_select_same_org
on public.pre_visit_requirement
for select
using (public.is_staff() and public.appointment_belongs_to_current_org(appointment_id));

drop policy if exists pre_visit_requirement_patient_select_own on public.pre_visit_requirement;
create policy pre_visit_requirement_patient_select_own
on public.pre_visit_requirement
for select
using (
  exists (
    select 1
    from public.appointment a
    where a.id = appointment_id
      and a.patient_id = public.current_patient_id()
  )
);

drop policy if exists pre_visit_requirement_staff_manage_same_org on public.pre_visit_requirement;
create policy pre_visit_requirement_staff_manage_same_org
on public.pre_visit_requirement
for all
using (public.can_write_clinical_data() and public.appointment_belongs_to_current_org(appointment_id))
with check (public.can_write_clinical_data() and public.appointment_belongs_to_current_org(appointment_id));

-- ---------------------------------------------------------
-- refill_request
-- ---------------------------------------------------------

drop policy if exists refill_request_staff_select_same_org on public.refill_request;
create policy refill_request_staff_select_same_org
on public.refill_request
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists refill_request_patient_select_own on public.refill_request;
create policy refill_request_patient_select_own
on public.refill_request
for select
using (public.is_current_patient(patient_id));

drop policy if exists refill_request_patient_insert_own on public.refill_request;
create policy refill_request_patient_insert_own
on public.refill_request
for insert
with check (
  public.is_patient_actor()
  and public.is_current_patient(patient_id)
  and public.belongs_to_current_org(organization_id)
  and requested_by_type = 'patient'::public.requested_by_type_enum
  and (requested_by_ref_id is null or requested_by_ref_id = public.current_patient_id())
  and exists (
    select 1
    from public.prescription p
    where p.id = source_prescription_id
      and p.patient_id = public.current_patient_id()
      and p.treatment_episode_id = treatment_episode_id
      and p.organization_id = organization_id
  )
);

drop policy if exists refill_request_staff_manage_same_org on public.refill_request;
create policy refill_request_staff_manage_same_org
on public.refill_request
for all
using (public.can_manage_refills() and public.belongs_to_current_org(organization_id))
with check (public.can_manage_refills() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- refill_request_item
-- ---------------------------------------------------------

drop policy if exists refill_request_item_staff_select_same_org on public.refill_request_item;
create policy refill_request_item_staff_select_same_org
on public.refill_request_item
for select
using (public.is_staff() and public.refill_request_belongs_to_current_org(refill_request_id));

drop policy if exists refill_request_item_patient_select_own on public.refill_request_item;
create policy refill_request_item_patient_select_own
on public.refill_request_item
for select
using (
  exists (
    select 1
    from public.refill_request rr
    where rr.id = refill_request_id
      and rr.patient_id = public.current_patient_id()
  )
);

drop policy if exists refill_request_item_patient_insert_own on public.refill_request_item;
create policy refill_request_item_patient_insert_own
on public.refill_request_item
for insert
with check (
  public.is_patient_actor()
  and exists (
    select 1
    from public.refill_request rr
    join public.prescription_item pi on pi.id = prescription_item_id
    where rr.id = refill_request_id
      and rr.patient_id = public.current_patient_id()
      and rr.status = 'submitted'::public.refill_request_status_enum
      and pi.prescription_id = rr.source_prescription_id
  )
);

drop policy if exists refill_request_item_staff_manage_same_org on public.refill_request_item;
create policy refill_request_item_staff_manage_same_org
on public.refill_request_item
for all
using (public.can_manage_refills() and public.refill_request_belongs_to_current_org(refill_request_id))
with check (public.can_manage_refills() and public.refill_request_belongs_to_current_org(refill_request_id));

-- ---------------------------------------------------------
-- treatment_event
-- ---------------------------------------------------------

drop policy if exists treatment_event_staff_select_same_org on public.treatment_event;
create policy treatment_event_staff_select_same_org
on public.treatment_event
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists treatment_event_patient_select_visible_own on public.treatment_event;
create policy treatment_event_patient_select_visible_own
on public.treatment_event
for select
using (
  public.is_current_patient(patient_id)
  and visibility_scope = 'patient_visible'::public.visibility_scope_enum
);

commit;
