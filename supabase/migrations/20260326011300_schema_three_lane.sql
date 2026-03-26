begin;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'three_lane_actor_enum'
  ) then
    create type public.three_lane_actor_enum as enum ('personal', 'family', 'hospital', 'unknown');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'care_lane_enum'
  ) then
    create type public.care_lane_enum as enum ('personal', 'family', 'hospital');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'family_access_role_enum'
  ) then
    create type public.family_access_role_enum as enum ('caregiver', 'guardian', 'viewer', 'proxy');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'care_profile_status_enum'
  ) then
    create type public.care_profile_status_enum as enum ('active', 'paused', 'archived');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'consent_grantee_type_enum'
  ) then
    create type public.consent_grantee_type_enum as enum ('patient', 'organization');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'consent_status_enum'
  ) then
    create type public.consent_status_enum as enum ('active', 'revoked', 'expired');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'interaction_severity_enum'
  ) then
    create type public.interaction_severity_enum as enum ('minor', 'moderate', 'major', 'contraindicated');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'interaction_alert_status_enum'
  ) then
    create type public.interaction_alert_status_enum as enum ('open', 'acknowledged', 'overridden', 'resolved', 'dismissed');
  end if;
end
$$;

create table if not exists public.personal_profile (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  preferred_name text,
  language_code text,
  timezone text,
  profile_status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_profile_patient_unique unique (patient_id),
  constraint personal_profile_preferred_name_nonempty
    check (preferred_name is null or length(trim(preferred_name)) > 0)
);

create unique index if not exists personal_profile_auth_user_id_unique
  on public.personal_profile (auth_user_id)
  where auth_user_id is not null;

create index if not exists personal_profile_status_idx
  on public.personal_profile (profile_status);

create table if not exists public.family_profile (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  relationship_type public.relationship_type_enum not null default 'other',
  access_role public.family_access_role_enum not null default 'caregiver',
  can_receive_notifications boolean not null default true,
  profile_status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_profile_full_name_nonempty check (length(trim(full_name)) > 0)
);

create unique index if not exists family_profile_auth_user_id_unique
  on public.family_profile (auth_user_id)
  where auth_user_id is not null;

create index if not exists family_profile_patient_status_idx
  on public.family_profile (patient_id, profile_status);

create table if not exists public.shared_care_profile (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient(id) on delete cascade,
  personal_profile_id uuid references public.personal_profile(id) on delete set null,
  display_name text,
  care_preferences_json jsonb not null default '{}'::jsonb,
  status public.care_profile_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shared_care_profile_patient_unique unique (patient_id),
  constraint shared_care_profile_display_name_nonempty
    check (display_name is null or length(trim(display_name)) > 0),
  constraint shared_care_profile_preferences_is_object
    check (jsonb_typeof(care_preferences_json) = 'object')
);

create index if not exists shared_care_profile_status_idx
  on public.shared_care_profile (status);

create table if not exists public.family_profile_care_profile_bridge (
  family_profile_id uuid not null references public.family_profile(id) on delete cascade,
  shared_care_profile_id uuid not null references public.shared_care_profile(id) on delete cascade,
  granted_by_user_account_id uuid references public.user_account(id) on delete set null,
  grant_reason text,
  is_primary_contact boolean not null default false,
  created_at timestamptz not null default now(),
  constraint family_profile_care_profile_bridge_pk primary key (family_profile_id, shared_care_profile_id),
  constraint family_profile_care_profile_bridge_reason_nonempty
    check (grant_reason is null or length(trim(grant_reason)) > 0)
);

create unique index if not exists fp_care_profile_bridge_one_primary_contact_per_profile
  on public.family_profile_care_profile_bridge (shared_care_profile_id)
  where is_primary_contact = true;

create table if not exists public.shared_care_profile_episode_bridge (
  shared_care_profile_id uuid not null references public.shared_care_profile(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  linked_by_user_account_id uuid references public.user_account(id) on delete set null,
  link_note text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint shared_care_profile_episode_bridge_pk
    primary key (shared_care_profile_id, treatment_episode_id),
  constraint shared_care_profile_episode_bridge_note_nonempty
    check (link_note is null or length(trim(link_note)) > 0)
);

create unique index if not exists scp_episode_bridge_one_primary_per_profile
  on public.shared_care_profile_episode_bridge (shared_care_profile_id)
  where is_primary = true;

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

create table if not exists public.medication_catalog (
  id uuid primary key default gen_random_uuid(),
  medication_master_id uuid references public.medication_master(id) on delete set null,
  catalog_code text,
  generic_name text not null,
  brand_name text,
  strength_text text not null,
  dosage_form public.dosage_form_enum not null,
  route public.route_enum not null,
  atc_class text,
  is_high_risk boolean not null default false,
  is_controlled_substance boolean not null default false,
  status public.record_status_enum not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_catalog_generic_name_nonempty check (length(trim(generic_name)) > 0),
  constraint medication_catalog_strength_text_nonempty check (length(trim(strength_text)) > 0)
);

create unique index if not exists medication_catalog_code_unique
  on public.medication_catalog (catalog_code)
  where catalog_code is not null;

create unique index if not exists medication_catalog_medication_master_unique
  on public.medication_catalog (medication_master_id)
  where medication_master_id is not null;

create table if not exists public.active_ingredient (
  id uuid primary key default gen_random_uuid(),
  ingredient_code text,
  ingredient_name text not null,
  display_name text,
  standard_system text,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_ingredient_name_nonempty check (length(trim(ingredient_name)) > 0)
);

create unique index if not exists active_ingredient_name_unique
  on public.active_ingredient (lower(ingredient_name));

create table if not exists public.medication_ingredient_map (
  id uuid primary key default gen_random_uuid(),
  medication_catalog_id uuid not null references public.medication_catalog(id) on delete cascade,
  active_ingredient_id uuid not null references public.active_ingredient(id) on delete restrict,
  ingredient_strength_text text,
  strength_value numeric(14,6),
  strength_unit text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (medication_catalog_id, active_ingredient_id)
);

create table if not exists public.drug_interaction_rule (
  id uuid primary key default gen_random_uuid(),
  rule_code text,
  title text not null,
  severity public.interaction_severity_enum not null,
  clinical_effect text,
  mechanism text,
  recommendation text,
  evidence_level text,
  source_ref text,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drug_interaction_rule_title_nonempty check (length(trim(title)) > 0)
);

create unique index if not exists drug_interaction_rule_code_unique
  on public.drug_interaction_rule (rule_code)
  where rule_code is not null;

create table if not exists public.drug_interaction_rule_detail (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.drug_interaction_rule(id) on delete cascade,
  ingredient_a_id uuid not null references public.active_ingredient(id) on delete restrict,
  ingredient_b_id uuid not null references public.active_ingredient(id) on delete restrict,
  directionality text not null default 'bidirectional',
  dose_context text,
  population_context text,
  notes text,
  created_at timestamptz not null default now(),
  constraint interaction_pair_not_same check (ingredient_a_id <> ingredient_b_id)
);

create unique index if not exists drug_interaction_rule_detail_pair_unique
  on public.drug_interaction_rule_detail (
    rule_id,
    least(ingredient_a_id, ingredient_b_id),
    greatest(ingredient_a_id, ingredient_b_id)
  );

create table if not exists public.drug_combination_guidance (
  id uuid primary key default gen_random_uuid(),
  medication_catalog_a_id uuid not null references public.medication_catalog(id) on delete cascade,
  medication_catalog_b_id uuid not null references public.medication_catalog(id) on delete cascade,
  guidance_text text not null,
  severity public.interaction_severity_enum not null default 'moderate',
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint combination_guidance_nonempty check (length(trim(guidance_text)) > 0),
  constraint combination_not_same_medication check (medication_catalog_a_id <> medication_catalog_b_id)
);

create unique index if not exists drug_combination_guidance_pair_unique
  on public.drug_combination_guidance (
    least(medication_catalog_a_id, medication_catalog_b_id),
    greatest(medication_catalog_a_id, medication_catalog_b_id)
  );

create table if not exists public.drug_contraindication (
  id uuid primary key default gen_random_uuid(),
  medication_catalog_id uuid not null references public.medication_catalog(id) on delete cascade,
  contraindication_code text,
  contraindication_label text not null,
  clinical_note text,
  severity public.interaction_severity_enum not null default 'major',
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contraindication_label_nonempty check (length(trim(contraindication_label)) > 0)
);

create table if not exists public.drug_allergy_cross_reactivity (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredient(id) on delete cascade,
  allergy_group_code text,
  allergy_group_label text not null,
  risk_note text,
  severity public.interaction_severity_enum not null default 'moderate',
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint allergy_group_label_nonempty check (length(trim(allergy_group_label)) > 0)
);

create table if not exists public.care_profile_bridge (
  id uuid primary key default gen_random_uuid(),
  owner_patient_id uuid not null references public.patient(id) on delete cascade,
  subject_patient_id uuid not null references public.patient(id) on delete cascade,
  lane public.care_lane_enum not null,
  organization_id uuid references public.organization(id) on delete set null,
  relationship_type public.relationship_type_enum,
  bridge_note text,
  is_active boolean not null default true,
  created_by_user_account_id uuid references public.user_account(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_profile_bridge_lane_org_check check (
    (lane = 'hospital' and organization_id is not null) or (lane in ('personal', 'family'))
  )
);

create unique index if not exists care_profile_bridge_unique_active
  on public.care_profile_bridge (
    owner_patient_id,
    subject_patient_id,
    lane,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where is_active = true;

create table if not exists public.consent_grant (
  id uuid primary key default gen_random_uuid(),
  grantor_patient_id uuid not null references public.patient(id) on delete cascade,
  subject_patient_id uuid not null references public.patient(id) on delete cascade,
  grantee_type public.consent_grantee_type_enum not null,
  grantee_patient_id uuid references public.patient(id) on delete cascade,
  grantee_organization_id uuid references public.organization(id) on delete cascade,
  lane_from public.care_lane_enum not null,
  lane_to public.care_lane_enum not null,
  purpose text not null default 'care',
  permissions jsonb not null default '{"read": true, "write_alert_log": false}'::jsonb,
  status public.consent_status_enum not null default 'active',
  granted_at timestamptz not null default now(),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  created_by_user_account_id uuid references public.user_account(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consent_grant_grantee_shape_check check (
    (grantee_type = 'patient' and grantee_patient_id is not null and grantee_organization_id is null)
    or (grantee_type = 'organization' and grantee_organization_id is not null and grantee_patient_id is null)
  ),
  constraint consent_grant_valid_range check (valid_to is null or valid_to >= valid_from)
);

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

commit;

