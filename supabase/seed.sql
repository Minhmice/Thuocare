-- =============================================================
-- Thuocare — FULL demo seed (one doctor + rich clinical test data)
--
-- Chạy trong Supabase SQL Editor (postgres / service_role).
-- UUID cố định (chỉ 0-9a-f) để dễ tham chiếu và ON CONFLICT (id).
--
-- Web / onboarding:
--   Organization code: DEMO
--   Bác sĩ (staff):      doctor@demo.com
--   Bệnh nhân (data):    patient.an@example.com , patient.binh@example.com
--
-- Sau khi tạo user auth doctor@demo.com, bỏ comment khối UPDATE cuối file
-- hoặc dùng trang "Link my staff account" với code DEMO.
-- =============================================================

-- ─── Core tenant & staff ─────────────────────────────────────

insert into public.organization (id, code, name, org_type, status)
values (
  'a0000000-0000-0000-0000-000000000001',
  'DEMO',
  'Demo Clinic',
  'independent_clinic',
  'active'
)
on conflict (id) do nothing;

insert into public.clinic (
  id,
  organization_id,
  code,
  name,
  address_text,
  phone,
  status
)
values (
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'MAIN',
  'Demo Clinic — Main site',
  '123 Nguyen Hue, District 1, Ho Chi Minh City',
  '+842812345678',
  'active'
)
on conflict (id) do nothing;

insert into public.user_account (
  id,
  organization_id,
  clinic_id,
  role,
  full_name,
  email,
  phone,
  status
)
values (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'doctor',
  'Dr. Nguyen Demo',
  'doctor@demo.com',
  '+84901234567',
  'active'
)
on conflict (id) do nothing;

insert into public.doctor_profile (
  id,
  user_account_id,
  license_no,
  specialty,
  title,
  default_clinic_id,
  status
)
values (
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'GND-2024-001',
  'General Internal Medicine',
  'Dr.',
  'a0000000-0000-0000-0000-000000000002',
  'active'
)
on conflict (id) do nothing;

-- ─── Patients ────────────────────────────────────────────────

insert into public.patient (
  id,
  organization_id,
  external_patient_code,
  full_name,
  date_of_birth,
  sex,
  phone,
  email,
  address_text,
  preferred_language,
  communication_preference,
  status
)
values
  (
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'PT-DEMO-001',
    'Tran Thi An',
    '1985-06-12',
    'female',
    '+84987654321',
    'patient.an@example.com',
    '45 Le Loi, Q1, HCMC',
    'vi',
    'app',
    'active'
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'PT-DEMO-002',
    'Le Van Binh',
    '1992-03-22',
    'male',
    '+84901112233',
    'patient.binh@example.com',
    '12 Vo Van Tan, Q3, HCMC',
    'vi',
    'mixed',
    'active'
  )
on conflict (id) do nothing;

insert into public.caregiver_link (
  id,
  patient_id,
  caregiver_name,
  relationship_type,
  phone,
  notification_scope,
  is_primary,
  status
)
values (
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000003',
  'Tran Van Hai',
  'spouse',
  '+84905556677',
  'missed_dose_only',
  true,
  'active'
)
on conflict (id) do nothing;

-- ─── Episode + encounter + diagnosis ─────────────────────────

insert into public.treatment_episode (
  id,
  organization_id,
  clinic_id,
  patient_id,
  primary_doctor_id,
  episode_type,
  condition_group,
  title,
  clinical_summary,
  start_date,
  target_end_date,
  current_status,
  risk_tier,
  next_review_due_at,
  last_activity_at
)
values (
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000001',
  'chronic_management',
  'Metabolic / CV risk',
  'Type 2 diabetes & hypertension — long-term care',
  'HbA1c elevated on last visit; BP borderline. Lifestyle counseling ongoing.',
  '2025-11-01',
  null,
  'active',
  'medium',
  (now() + interval '14 days'),
  now()
)
on conflict (id) do nothing;

insert into public.treatment_episode (
  id,
  organization_id,
  clinic_id,
  patient_id,
  primary_doctor_id,
  episode_type,
  title,
  clinical_summary,
  start_date,
  current_status,
  risk_tier
)
values (
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000001',
  'acute_course',
  'URI follow-up',
  'Resolved upper respiratory infection; routine check.',
  '2026-02-01',
  'monitoring',
  'low'
)
on conflict (id) do nothing;

insert into public.encounter (
  id,
  organization_id,
  clinic_id,
  patient_id,
  treatment_episode_id,
  doctor_id,
  encounter_type,
  encounter_at,
  chief_complaint,
  assessment_summary,
  plan_summary,
  next_follow_up_recommendation_at
)
values (
  'a0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'd0000000-0000-0000-0000-000000000001',
  'in_person',
  '2026-01-10 09:30:00+07',
  'Follow-up diabetes and blood pressure',
  'T2DM on OAD; BP 138/86. Continue current meds, reinforce diet.',
  'Renew metformin and amlodipine; HbA1c in 3 months.',
  '2026-04-10 09:00:00+07'
)
on conflict (id) do nothing;

insert into public.diagnosis (
  id,
  encounter_id,
  treatment_episode_id,
  coding_system,
  diagnosis_code,
  diagnosis_label,
  is_primary,
  clinical_status,
  noted_at
)
values
  (
    'a0000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000010',
    'ICD-10',
    'E11.9',
    'Type 2 diabetes mellitus without complications',
    true,
    'active',
    '2026-01-10 09:30:00+07'
  ),
  (
    'a0000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000010',
    'ICD-10',
    'I10',
    'Essential (primary) hypertension',
    false,
    'active',
    '2026-01-10 09:30:00+07'
  )
on conflict (id) do nothing;

-- ─── Medication catalog ──────────────────────────────────────

insert into public.medication_master (
  id,
  standard_code,
  generic_name,
  brand_name,
  strength_text,
  dosage_form,
  route,
  atc_class,
  is_high_risk,
  is_controlled_substance,
  status
)
values
  (
    'a0000000-0000-0000-0000-000000000015',
    'VN-MET-850',
    'Metformin',
    'Glucophage',
    '850 mg',
    'tablet',
    'oral',
    'A10BA02',
    false,
    false,
    'active'
  ),
  (
    'a0000000-0000-0000-0000-000000000016',
    'VN-AML-5',
    'Amlodipine',
    'Norvasc',
    '5 mg',
    'tablet',
    'oral',
    'C08CA01',
    false,
    false,
    'active'
  )
on conflict (id) do nothing;

-- ─── Prescription + items + schedule + refill policy ─────────

insert into public.prescription (
  id,
  organization_id,
  clinic_id,
  patient_id,
  treatment_episode_id,
  encounter_id,
  doctor_id,
  prescription_kind,
  issue_source,
  status,
  issued_at,
  effective_from,
  effective_to,
  days_supply_total,
  renewal_sequence_no,
  clinical_note,
  patient_friendly_summary
)
values (
  'a0000000-0000-0000-0000-000000000017',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000012',
  'd0000000-0000-0000-0000-000000000001',
  'initial',
  'visit',
  'active',
  '2026-01-10 10:00:00+07',
  '2026-01-10',
  null,
  60,
  0,
  'OAD + CCB for DM2 + HTN.',
  'Take metformin twice daily after meals; amlodipine once in the morning.'
)
on conflict (id) do nothing;

insert into public.prescription_item (
  id,
  prescription_id,
  line_no,
  medication_master_id,
  indication_text,
  dose_amount,
  dose_unit,
  route,
  frequency_code,
  frequency_text,
  timing_relation,
  administration_instruction_text,
  patient_instruction_text,
  prn_flag,
  quantity_prescribed,
  quantity_unit,
  days_supply,
  start_date,
  end_date,
  is_refillable,
  max_refills_allowed,
  requires_review_before_refill,
  high_risk_review_flag,
  status
)
values
  (
    'a0000000-0000-0000-0000-000000000018',
    'a0000000-0000-0000-0000-000000000017',
    1,
    'a0000000-0000-0000-0000-000000000015',
    'Type 2 diabetes',
    1,
    'tablet',
    'oral',
    'BID',
    '2 times daily after breakfast and dinner',
    'after_meal',
    'Swallow whole with water.',
    'Take after meals to reduce stomach upset.',
    false,
    60,
    'tablet',
    30,
    '2026-01-10',
    null,
    true,
    3,
    false,
    false,
    'active'
  ),
  (
    'a0000000-0000-0000-0000-000000000019',
    'a0000000-0000-0000-0000-000000000017',
    2,
    'a0000000-0000-0000-0000-000000000016',
    'Hypertension',
    1,
    'tablet',
    'oral',
    'OD',
    'Once daily in the morning',
    'none',
    'May take with or without food.',
    'Take at the same time each morning.',
    false,
    30,
    'tablet',
    30,
    '2026-01-10',
    null,
    true,
    2,
    true,
    false,
    'active'
  )
on conflict (id) do nothing;

insert into public.dose_schedule (
  id,
  prescription_item_id,
  schedule_type,
  timezone_mode,
  times_per_day,
  structured_schedule_json,
  first_dose_at,
  grace_window_minutes,
  mark_missed_after_minutes
)
values
  (
    'a0000000-0000-0000-0000-00000000001a',
    'a0000000-0000-0000-0000-000000000018',
    'fixed_times_daily',
    'patient_local_time',
    2,
    '[
      {"slot": "morning", "time": "08:00", "label": "After breakfast"},
      {"slot": "evening", "time": "20:00", "label": "After dinner"}
    ]'::jsonb,
    '2026-01-11 08:00:00+07',
    45,
    180
  ),
  (
    'a0000000-0000-0000-0000-00000000001b',
    'a0000000-0000-0000-0000-000000000019',
    'fixed_times_daily',
    'patient_local_time',
    1,
    '[{"slot": "morning", "time": "07:30", "label": "Morning"}]'::jsonb,
    '2026-01-11 07:30:00+07',
    60,
    240
  )
on conflict (id) do nothing;

insert into public.refill_policy_snapshot (
  id,
  prescription_item_id,
  refill_mode,
  max_refills_allowed,
  min_days_between_refills,
  earliest_refill_ratio,
  notes
)
values
  (
    'a0000000-0000-0000-0000-00000000001c',
    'a0000000-0000-0000-0000-000000000018',
    'patient_request_allowed',
    3,
    25,
    0.8000,
    'Allow early refill at ~80% depletion.'
  ),
  (
    'a0000000-0000-0000-0000-00000000001d',
    'a0000000-0000-0000-0000-000000000019',
    'doctor_review_required',
    2,
    20,
    0.7500,
    'CCB — doctor review before each refill.'
  )
on conflict (id) do nothing;

-- ─── Follow-up + appointment + pre-visit ───────────────────

insert into public.follow_up_plan (
  id,
  organization_id,
  patient_id,
  treatment_episode_id,
  source_prescription_id,
  owner_doctor_id,
  follow_up_type,
  trigger_mode,
  due_at,
  required_before_refill,
  instruction_text,
  status
)
values (
  'a0000000-0000-0000-0000-00000000001e',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000017',
  'd0000000-0000-0000-0000-000000000001',
  'lab_review',
  'relative_to_issue_date',
  '2026-04-10 09:00:00+07',
  false,
  'HbA1c and lipid panel before next visit.',
  'planned'
)
on conflict (id) do nothing;

insert into public.appointment (
  id,
  organization_id,
  clinic_id,
  patient_id,
  treatment_episode_id,
  follow_up_plan_id,
  doctor_id,
  appointment_type,
  scheduled_start_at,
  scheduled_end_at,
  status,
  reason_text
)
values (
  'a0000000-0000-0000-0000-00000000001f',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-00000000001e',
  'd0000000-0000-0000-0000-000000000001',
  'in_person_revisit',
  '2026-04-10 09:00:00+07',
  '2026-04-10 09:30:00+07',
  'scheduled',
  'Chronic follow-up: diabetes & BP review + labs'
)
on conflict (id) do nothing;

insert into public.pre_visit_requirement (
  id,
  appointment_id,
  requirement_type,
  instruction_text,
  status
)
values (
  'a0000000-0000-0000-0000-000000000020',
  'a0000000-0000-0000-0000-00000000001f',
  'fasting_required',
  'Fast 8 hours before appointment if lab is same day.',
  'pending'
)
on conflict (id) do nothing;

-- ─── Refill request (hàng chờ bác sĩ) ─────────────────────────

insert into public.refill_request (
  id,
  organization_id,
  patient_id,
  treatment_episode_id,
  request_scope,
  source_prescription_id,
  requested_by_type,
  requested_by_ref_id,
  trigger_source,
  preferred_fulfillment,
  patient_comment,
  status,
  submitted_at
)
values (
  'a0000000-0000-0000-0000-000000000021',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'selected_items',
  'a0000000-0000-0000-0000-000000000017',
  'patient',
  'a0000000-0000-0000-0000-000000000003',
  'manual_request',
  'pickup',
  'Running low on metformin after travel.',
  'awaiting_doctor_review',
  '2026-03-18 14:00:00+07'
)
on conflict (id) do nothing;

insert into public.refill_request_item (
  id,
  refill_request_id,
  prescription_item_id,
  requested_quantity,
  status
)
values (
  'a0000000-0000-0000-0000-000000000022',
  'a0000000-0000-0000-0000-000000000021',
  'a0000000-0000-0000-0000-000000000018',
  60,
  'pending'
)
on conflict (id) do nothing;

-- ─── Adherence (timeline bệnh nhân) ───────────────────────────

insert into public.medication_adherence_log (
  id,
  organization_id,
  patient_id,
  prescription_item_id,
  scheduled_date,
  scheduled_time,
  actual_taken_time,
  status,
  source,
  notes
)
values
  (
    'a0000000-0000-0000-0000-000000000023',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000018',
    '2026-03-20',
    '2026-03-20 08:05:00+07',
    '2026-03-20 08:08:00+07',
    'taken',
    'patient',
    null
  ),
  (
    'a0000000-0000-0000-0000-000000000024',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000018',
    '2026-03-20',
    '2026-03-20 20:00:00+07',
    null,
    'scheduled',
    'system',
    null
  ),
  (
    'a0000000-0000-0000-0000-000000000025',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000019',
    '2026-03-21',
    '2026-03-21 07:30:00+07',
    null,
    'missed',
    'system',
    'Auto-missed (demo)'
  )
on conflict (id) do nothing;

-- ─── Notifications ─────────────────────────────────────────

insert into public.notification_event (
  id,
  organization_id,
  patient_id,
  type,
  reference_type,
  reference_id,
  payload,
  scheduled_at,
  status,
  is_read
)
values (
  'a0000000-0000-0000-0000-000000000026',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'dose_reminder',
  'prescription_item',
  'a0000000-0000-0000-0000-000000000018',
  '{"medication": "Metformin 850 mg", "dose_time": "20:00", "lead_minutes": 15}'::jsonb,
  '2026-03-22 19:45:00+07',
  'pending',
  false
)
on conflict (id) do nothing;

insert into public.notification_delivery_log (
  id,
  notification_event_id,
  channel,
  status,
  response_payload
)
values (
  'a0000000-0000-0000-0000-000000000027',
  'a0000000-0000-0000-0000-000000000026',
  'in_app',
  'success',
  '{"delivered": true}'::jsonb
)
on conflict (id) do nothing;

-- ─── Treatment timeline events ───────────────────────────────

insert into public.treatment_event (
  id,
  organization_id,
  patient_id,
  treatment_episode_id,
  entity_type,
  entity_id,
  event_type,
  event_at,
  actor_type,
  actor_ref_id,
  payload_json,
  visibility_scope
)
values
  (
    'a0000000-0000-0000-0000-000000000028',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000010',
    'episode',
    'a0000000-0000-0000-0000-000000000010',
    'episode_created',
    '2025-11-01 10:00:00+07',
    'doctor',
    'd0000000-0000-0000-0000-000000000001',
    '{"title": "Chronic care episode opened"}'::jsonb,
    'doctor_and_staff'
  ),
  (
    'a0000000-0000-0000-0000-000000000029',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000010',
    'prescription',
    'a0000000-0000-0000-0000-000000000017',
    'prescription_issued',
    '2026-01-10 10:00:00+07',
    'doctor',
    'd0000000-0000-0000-0000-000000000001',
    '{"lines": 2}'::jsonb,
    'patient_visible'
  ),
  (
    'a0000000-0000-0000-0000-00000000002a',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000010',
    'refill_request',
    'a0000000-0000-0000-0000-000000000021',
    'refill_requested',
    '2026-03-18 14:00:00+07',
    'patient',
    'a0000000-0000-0000-0000-000000000003',
    null,
    'patient_visible'
  )
on conflict (id) do nothing;

-- =============================================================
-- Gắn auth.users → user_account (bác sĩ)
-- Chạy SAU KHI đã có user Supabase Auth email doctor@demo.com
-- =============================================================
-- update public.user_account ua
-- set auth_user_id = u.id
-- from auth.users u
-- where lower(u.email) = lower('doctor@demo.com')
--   and ua.id = 'b0000000-0000-0000-0000-000000000001';
