-- =========================================================
-- Mobile preflight hardening (Phase 9 -> mobile readiness)
--
-- Goals:
-- 1) Fix patient read joins for medication details.
-- 2) Tighten patient adherence writes to own org/item only.
-- 3) Harden refill request patient insert checks.
-- 4) Enable safe patient cancel flow for pending refill requests.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Helper: ensure prescription_item belongs to current patient
-- ---------------------------------------------------------

create or replace function public.prescription_item_belongs_to_current_patient(
  target_prescription_item_id uuid
)
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
      and p.patient_id = public.current_patient_id()
  )
$$;

grant execute on function public.prescription_item_belongs_to_current_patient(uuid) to authenticated;

-- ---------------------------------------------------------
-- medication_master: allow patient read for medications linked to own Rx items
-- ---------------------------------------------------------

drop policy if exists medication_master_patient_select_own on public.medication_master;
create policy medication_master_patient_select_own
  on public.medication_master
  for select
  using (
    public.is_patient_actor()
    and exists (
      select 1
      from public.prescription_item pi
      join public.prescription p on p.id = pi.prescription_id
      where pi.medication_master_id = medication_master.id
        and p.patient_id = public.current_patient_id()
    )
  );

-- ---------------------------------------------------------
-- medication_adherence_log: tighten patient writes
-- ---------------------------------------------------------

drop policy if exists adherence_log_patient_insert_own on public.medication_adherence_log;
create policy adherence_log_patient_insert_own
  on public.medication_adherence_log
  for insert
  with check (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and organization_id = public.current_organization_id()
    and source in (
      'patient'::public.adherence_source_enum,
      'caregiver'::public.adherence_source_enum
    )
    and status in (
      'taken'::public.adherence_status_enum,
      'skipped'::public.adherence_status_enum
    )
    and public.prescription_item_belongs_to_current_patient(prescription_item_id)
    and exists (
      select 1
      from public.prescription_item pi
      join public.prescription p on p.id = pi.prescription_id
      where pi.id = prescription_item_id
        and p.organization_id = organization_id
    )
  );

drop policy if exists adherence_log_patient_update_own on public.medication_adherence_log;
create policy adherence_log_patient_update_own
  on public.medication_adherence_log
  for update
  using (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and public.prescription_item_belongs_to_current_patient(prescription_item_id)
  )
  with check (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and organization_id = public.current_organization_id()
    and source in (
      'patient'::public.adherence_source_enum,
      'caregiver'::public.adherence_source_enum
    )
    and status in (
      'taken'::public.adherence_status_enum,
      'skipped'::public.adherence_status_enum
    )
    and public.prescription_item_belongs_to_current_patient(prescription_item_id)
    and exists (
      select 1
      from public.prescription_item pi
      join public.prescription p on p.id = pi.prescription_id
      where pi.id = prescription_item_id
        and p.organization_id = organization_id
    )
  );

-- ---------------------------------------------------------
-- refill_request: tighten patient create + allow safe cancel
-- ---------------------------------------------------------

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
    and status = 'submitted'::public.refill_request_status_enum
    and triaged_at is null
    and reviewed_at is null
    and reviewed_by_doctor_id is null
    and result_prescription_id is null
    and exists (
      select 1
      from public.prescription p
      where p.id = source_prescription_id
        and p.patient_id = public.current_patient_id()
        and p.treatment_episode_id = treatment_episode_id
        and p.organization_id = organization_id
    )
  );

drop policy if exists refill_request_patient_cancel_own on public.refill_request;
create policy refill_request_patient_cancel_own
  on public.refill_request
  for update
  using (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and status in (
      'submitted'::public.refill_request_status_enum,
      'triaging'::public.refill_request_status_enum,
      'awaiting_doctor_review'::public.refill_request_status_enum
    )
  )
  with check (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and status = 'cancelled'::public.refill_request_status_enum
    and requested_by_type = 'patient'::public.requested_by_type_enum
    and (requested_by_ref_id is null or requested_by_ref_id = public.current_patient_id())
    and reviewed_at is null
    and reviewed_by_doctor_id is null
    and result_prescription_id is null
  );

commit;
