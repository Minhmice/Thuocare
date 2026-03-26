-- Demo: Trần Tuệ Minh — lane cá nhân (patient.organization_id null, không org/clinic/family_profile).
-- Đăng nhập: tran.tuemin@thuocare.local  |  mật khẩu: ThuocareDev123
-- Chạy sau migrations: supabase db reset (hoặc psql -f supabase/seed.sql với role có quyền ghi auth).

create extension if not exists pgcrypto;

do $seed$
declare
  v_auth_id   uuid := '8b2a3b4c-5d6e-7f80-9a01-bcdef0123456'::uuid;
  v_patient_id uuid := '8b2a3b4c-5d6e-7f80-9a01-bcdef0123457'::uuid;
  v_profile_id uuid := '8b2a3b4c-5d6e-7f80-9a01-bcdef0123458'::uuid;
  v_med_meta   uuid := '8b2a3b4c-5d6e-7f80-9a01-bcdef0123459'::uuid;
  v_med_ome    uuid := '8b2a3b4c-5d6e-7f80-9a01-bcdef012345a'::uuid;
  v_med_prn    uuid := '8b2a3b4c-5d6e-7f80-9a01-bcdef012345b'::uuid;
  v_encrypted  text := crypt('ThuocareDev123', gen_salt('bf'));
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_auth_id,
    'authenticated',
    'authenticated',
    'tran.tuemin@thuocare.local',
    v_encrypted,
    now(),
    null,
    '',
    now(),
    '',
    null,
    '',
    '',
    null,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', 'Trần Tuệ Minh',
      'actor_type', 'patient',
      'care_intent', 'personal'
    ),
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    v_auth_id,
    jsonb_build_object(
      'sub', v_auth_id::text,
      'email', 'tran.tuemin@thuocare.local',
      'email_verified', true
    ),
    'email',
    v_auth_id::text,
    now(),
    now(),
    now()
  where not exists (
    select 1
    from auth.identities i
    where i.user_id = v_auth_id
      and i.provider = 'email'
  );

  insert into public.patient (
    id,
    organization_id,
    auth_user_id,
    full_name,
    date_of_birth,
    sex,
    phone,
    email,
    address_text,
    preferred_language,
    communication_preference,
    status
  ) values (
    v_patient_id,
    null,
    v_auth_id,
    'Trần Tuệ Minh',
    '1992-08-15'::date,
    'male',
    '+84901234567',
    'tran.tuemin@thuocare.local',
    'Quận 1, TP. Hồ Chí Minh',
    'vi',
    'app',
    'active'
  )
  on conflict (id) do nothing;

  insert into public.personal_profile (
    id,
    patient_id,
    auth_user_id,
    preferred_name,
    language_code,
    timezone,
    profile_status
  ) values (
    v_profile_id,
    v_patient_id,
    v_auth_id,
    'Tuệ Minh',
    'vi',
    'Asia/Ho_Chi_Minh',
    'active'
  )
  on conflict (id) do nothing;

  insert into public.caregiver_link (
    id,
    patient_id,
    caregiver_name,
    relationship_type,
    phone,
    email,
    notification_scope,
    is_primary,
    status
  ) values (
    'cafe2001-0001-4001-8001-000000000001'::uuid,
    v_patient_id,
    'Nguyễn Thị Lan',
    'parent',
    '+84907654321',
    'lan.nguyen@example.com',
    'missed_dose_only',
    true,
    'active'
  )
  on conflict (id) do nothing;

  insert into public.personal_medication (
    id,
    patient_id,
    personal_profile_id,
    catalog_id,
    custom_name,
    display_name,
    strength_text,
    dosage_form,
    dose_amount,
    dose_unit,
    frequency_code,
    dose_schedule_json,
    start_date,
    end_date,
    notes,
    status
  ) values (
    v_med_meta,
    v_patient_id,
    v_profile_id,
    null,
    'Metformin',
    'Metformin',
    '500 mg',
    'viên nén',
    1,
    'viên',
    'BID',
    '{"type":"fixed_times_daily","dose_times":["07:00","19:00"]}'::jsonb,
    '2026-01-01'::date,
    null,
    'Uống trong hoặc ngay sau bữa ăn.',
    'active'
  ),
  (
    v_med_ome,
    v_patient_id,
    v_profile_id,
    null,
    'Omeprazole',
    'Omeprazole',
    '20 mg',
    'viên nang',
    1,
    'viên',
    'QD',
    '{"type":"fixed_times_daily","dose_times":["06:30"]}'::jsonb,
    '2026-02-01'::date,
    null,
    'Buổi sáng trước ăn 30 phút.',
    'active'
  ),
  (
    v_med_prn,
    v_patient_id,
    v_profile_id,
    null,
    'Paracetamol',
    'Paracetamol',
    '500 mg',
    'viên sủi',
    1,
    'viên',
    'PRN',
    '{"type":"prn","max_daily_doses":4,"min_hours_between_doses":4}'::jsonb,
    '2026-01-15'::date,
    null,
    'Chỉ khi sốt hoặc đau đầu; không quá 4 lần/ngày.',
    'active'
  )
  on conflict (id) do nothing;

  insert into public.personal_adherence_log (
    id,
    patient_id,
    personal_medication_id,
    scheduled_date,
    scheduled_time,
    actual_taken_time,
    status,
    source
  ) values
    (
      'cafe1001-0001-4001-8001-000000000001'::uuid,
      v_patient_id,
      v_med_meta,
      '2026-03-24'::date,
      '2026-03-24 07:00:00+07'::timestamptz,
      '2026-03-24 07:08:00+07'::timestamptz,
      'taken',
      'user'
    ),
    (
      'cafe1001-0001-4001-8001-000000000002'::uuid,
      v_patient_id,
      v_med_meta,
      '2026-03-24'::date,
      '2026-03-24 19:00:00+07'::timestamptz,
      '2026-03-24 19:22:00+07'::timestamptz,
      'taken',
      'user'
    ),
    (
      'cafe1001-0001-4001-8001-000000000003'::uuid,
      v_patient_id,
      v_med_meta,
      '2026-03-25'::date,
      '2026-03-25 07:00:00+07'::timestamptz,
      null,
      'missed',
      'user'
    ),
    (
      'cafe1001-0001-4001-8001-000000000004'::uuid,
      v_patient_id,
      v_med_ome,
      '2026-03-25'::date,
      '2026-03-25 06:30:00+07'::timestamptz,
      '2026-03-25 06:35:00+07'::timestamptz,
      'taken',
      'user'
    ),
    (
      'cafe1001-0001-4001-8001-000000000005'::uuid,
      v_patient_id,
      v_med_ome,
      '2026-03-26'::date,
      '2026-03-26 06:30:00+07'::timestamptz,
      null,
      'skipped',
      'user'
    ),
    (
      'cafe1001-0001-4001-8001-000000000006'::uuid,
      v_patient_id,
      v_med_prn,
      '2026-03-26'::date,
      '2026-03-26 14:00:00+07'::timestamptz,
      '2026-03-26 14:05:00+07'::timestamptz,
      'taken',
      'user'
    )
  on conflict (patient_id, personal_medication_id, scheduled_time) do nothing;
end
$seed$;
