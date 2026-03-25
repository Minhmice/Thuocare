-- =========================================================
-- Thuocare
-- Phase 10: Three-lane foundation + medication knowledge base
-- Lanes: personal / family / hospital
--
-- Design goals:
-- 1) Additive and backward-compatible only.
-- 2) Keep existing hospital tables/flows intact.
-- 3) Add personal/family constructs and cross-lane consent bridge.
-- 4) Add shared medication knowledge base and interaction alert layer.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 0) Enum foundations (idempotent, additive)
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- 1) Three-lane personal/family core
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- 2) Hospital alignment bridges (non-destructive)
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- 3) Medication knowledge base
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- 4) Cross-lane consent and interaction alerts
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- 5) Actor and consent helper functions
-- ---------------------------------------------------------

create or replace function public.current_personal_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pp.id
  from public.personal_profile pp
  where pp.auth_user_id = auth.uid()
    and pp.profile_status = 'active'
  limit 1
$$;

create or replace function public.current_family_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select fp.id
  from public.family_profile fp
  where fp.auth_user_id = auth.uid()
    and fp.profile_status = 'active'
  limit 1
$$;

create or replace function public.current_family_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select fp.patient_id
  from public.family_profile fp
  where fp.auth_user_id = auth.uid()
    and fp.profile_status = 'active'
  limit 1
$$;

create or replace function public.current_three_lane_actor()
returns public.three_lane_actor_enum
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when public.current_personal_profile_id() is not null then 'personal'::public.three_lane_actor_enum
      when public.current_family_profile_id() is not null then 'family'::public.three_lane_actor_enum
      when public.current_staff_user_account_id() is not null then 'hospital'::public.three_lane_actor_enum
      when public.current_patient_id() is not null then 'hospital'::public.three_lane_actor_enum
      else 'unknown'::public.three_lane_actor_enum
    end
$$;

create or replace function public.current_three_lane_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select x.patient_id
  from (
    select pp.patient_id, 1 as priority
    from public.personal_profile pp
    where pp.auth_user_id = auth.uid()
      and pp.profile_status = 'active'
    union all
    select fp.patient_id, 2 as priority
    from public.family_profile fp
    where fp.auth_user_id = auth.uid()
      and fp.profile_status = 'active'
    union all
    select p.id as patient_id, 3 as priority
    from public.patient p
    where p.auth_user_id = auth.uid()
      and p.status = 'active'
  ) x
  order by x.priority
  limit 1
$$;

create or replace function public.is_active_consent_row(cg public.consent_grant)
returns boolean
language sql
stable
as $$
  select
    cg.status = 'active'::public.consent_status_enum
    and now() >= coalesce(cg.valid_from, now())
    and (cg.valid_to is null or now() <= cg.valid_to)
    and cg.revoked_at is null
$$;

create or replace function public.has_active_patient_consent(
  grantor_patient uuid,
  subject_patient uuid,
  grantee_patient uuid,
  required_permission text default 'read'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.consent_grant cg
    where cg.grantor_patient_id = grantor_patient
      and cg.subject_patient_id = subject_patient
      and cg.grantee_type = 'patient'::public.consent_grantee_type_enum
      and cg.grantee_patient_id = grantee_patient
      and public.is_active_consent_row(cg)
      and coalesce((cg.permissions ->> required_permission)::boolean, false)
  )
$$;

create or replace function public.has_active_org_consent(
  grantor_patient uuid,
  subject_patient uuid,
  grantee_org uuid,
  required_permission text default 'read'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.consent_grant cg
    where cg.grantor_patient_id = grantor_patient
      and cg.subject_patient_id = subject_patient
      and cg.grantee_type = 'organization'::public.consent_grantee_type_enum
      and cg.grantee_organization_id = grantee_org
      and public.is_active_consent_row(cg)
      and coalesce((cg.permissions ->> required_permission)::boolean, false)
  )
$$;

create or replace function public.can_read_care_profile_lane(
  lane_value public.care_lane_enum,
  owner_pid uuid,
  subject_pid uuid,
  org_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when lane_value = 'personal'::public.care_lane_enum then
      public.is_patient_actor() and public.is_current_patient(owner_pid)
    when lane_value = 'family'::public.care_lane_enum then
      public.current_family_patient_id() is not null and (
        owner_pid = public.current_family_patient_id()
        or subject_pid = public.current_family_patient_id()
      )
    when lane_value = 'hospital'::public.care_lane_enum then
      public.is_staff()
      and org_id is not null
      and public.belongs_to_current_org(org_id)
      and public.has_active_org_consent(owner_pid, subject_pid, org_id, 'read')
    else false
  end
$$;

create or replace function public.can_write_care_profile_lane(
  lane_value public.care_lane_enum,
  owner_pid uuid,
  subject_pid uuid,
  org_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when lane_value = 'personal'::public.care_lane_enum then
      public.is_patient_actor() and public.is_current_patient(owner_pid)
    when lane_value = 'family'::public.care_lane_enum then
      public.current_family_patient_id() is not null
      and owner_pid = public.current_family_patient_id()
    when lane_value = 'hospital'::public.care_lane_enum then
      public.can_write_clinical_data()
      and org_id is not null
      and public.belongs_to_current_org(org_id)
      and public.has_active_org_consent(owner_pid, subject_pid, org_id, 'write_alert_log')
    else false
  end
$$;

grant execute on function public.current_personal_profile_id() to authenticated;
grant execute on function public.current_family_profile_id() to authenticated;
grant execute on function public.current_family_patient_id() to authenticated;
grant execute on function public.current_three_lane_actor() to authenticated;
grant execute on function public.current_three_lane_patient_id() to authenticated;
grant execute on function public.is_active_consent_row(public.consent_grant) to authenticated;
grant execute on function public.has_active_patient_consent(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.has_active_org_consent(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.can_read_care_profile_lane(public.care_lane_enum, uuid, uuid, uuid) to authenticated;
grant execute on function public.can_write_care_profile_lane(public.care_lane_enum, uuid, uuid, uuid) to authenticated;

-- ---------------------------------------------------------
-- 6) Updated_at triggers
-- ---------------------------------------------------------

drop trigger if exists trg_personal_profile_set_updated_at on public.personal_profile;
create trigger trg_personal_profile_set_updated_at
before update on public.personal_profile
for each row execute function public.set_updated_at();

drop trigger if exists trg_family_profile_set_updated_at on public.family_profile;
create trigger trg_family_profile_set_updated_at
before update on public.family_profile
for each row execute function public.set_updated_at();

drop trigger if exists trg_shared_care_profile_set_updated_at on public.shared_care_profile;
create trigger trg_shared_care_profile_set_updated_at
before update on public.shared_care_profile
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_medication_catalog on public.medication_catalog;
create trigger set_updated_at_medication_catalog
before update on public.medication_catalog
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_active_ingredient on public.active_ingredient;
create trigger set_updated_at_active_ingredient
before update on public.active_ingredient
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_drug_interaction_rule on public.drug_interaction_rule;
create trigger set_updated_at_drug_interaction_rule
before update on public.drug_interaction_rule
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_drug_combination_guidance on public.drug_combination_guidance;
create trigger set_updated_at_drug_combination_guidance
before update on public.drug_combination_guidance
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_drug_contraindication on public.drug_contraindication;
create trigger set_updated_at_drug_contraindication
before update on public.drug_contraindication
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_drug_allergy_cross_reactivity on public.drug_allergy_cross_reactivity;
create trigger set_updated_at_drug_allergy_cross_reactivity
before update on public.drug_allergy_cross_reactivity
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_care_profile_bridge on public.care_profile_bridge;
create trigger set_updated_at_care_profile_bridge
before update on public.care_profile_bridge
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_consent_grant on public.consent_grant;
create trigger set_updated_at_consent_grant
before update on public.consent_grant
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_drug_interaction_alert_log on public.drug_interaction_alert_log;
create trigger set_updated_at_drug_interaction_alert_log
before update on public.drug_interaction_alert_log
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 7) RLS policies
-- ---------------------------------------------------------

alter table public.personal_profile enable row level security;
alter table public.family_profile enable row level security;
alter table public.shared_care_profile enable row level security;
alter table public.family_profile_care_profile_bridge enable row level security;
alter table public.shared_care_profile_episode_bridge enable row level security;
alter table public.shared_care_profile_prescription_bridge enable row level security;

alter table public.medication_catalog enable row level security;
alter table public.active_ingredient enable row level security;
alter table public.medication_ingredient_map enable row level security;
alter table public.drug_interaction_rule enable row level security;
alter table public.drug_interaction_rule_detail enable row level security;
alter table public.drug_combination_guidance enable row level security;
alter table public.drug_contraindication enable row level security;
alter table public.drug_allergy_cross_reactivity enable row level security;

alter table public.care_profile_bridge enable row level security;
alter table public.consent_grant enable row level security;
alter table public.drug_interaction_alert_log enable row level security;

drop policy if exists personal_profile_select_self on public.personal_profile;
create policy personal_profile_select_self on public.personal_profile
for select using (
  auth.uid() = auth_user_id
  or (public.is_staff() and public.patient_belongs_to_current_org(patient_id))
);

drop policy if exists personal_profile_update_self on public.personal_profile;
create policy personal_profile_update_self on public.personal_profile
for update using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists family_profile_select_self_or_staff on public.family_profile;
create policy family_profile_select_self_or_staff on public.family_profile
for select using (
  auth.uid() = auth_user_id
  or (public.is_patient_actor() and public.is_current_patient(patient_id))
  or (public.is_staff() and public.patient_belongs_to_current_org(patient_id))
);

drop policy if exists family_profile_manage_self on public.family_profile;
create policy family_profile_manage_self on public.family_profile
for all using (auth.uid() = auth_user_id)
with check (
  auth.uid() = auth_user_id
  and public.is_current_patient(patient_id)
);

drop policy if exists family_profile_care_profile_bridge_select on public.family_profile_care_profile_bridge;
create policy family_profile_care_profile_bridge_select on public.family_profile_care_profile_bridge
for select using (
  exists (
    select 1
    from public.family_profile fp
    where fp.id = family_profile_id
      and (
        fp.auth_user_id = auth.uid()
        or public.is_current_patient(fp.patient_id)
        or (public.is_staff() and public.patient_belongs_to_current_org(fp.patient_id))
      )
  )
);

drop policy if exists family_profile_care_profile_bridge_manage on public.family_profile_care_profile_bridge;
create policy family_profile_care_profile_bridge_manage on public.family_profile_care_profile_bridge
for all using (
  exists (
    select 1
    from public.family_profile fp
    where fp.id = family_profile_id
      and (
        fp.auth_user_id = auth.uid()
        or public.is_current_patient(fp.patient_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.family_profile fp
    where fp.id = family_profile_id
      and (
        fp.auth_user_id = auth.uid()
        or public.is_current_patient(fp.patient_id)
      )
  )
);

drop policy if exists shared_care_profile_episode_bridge_select on public.shared_care_profile_episode_bridge;
create policy shared_care_profile_episode_bridge_select on public.shared_care_profile_episode_bridge
for select using (
  exists (
    select 1
    from public.shared_care_profile scp
    where scp.id = shared_care_profile_id
      and (
        public.is_current_patient(scp.patient_id)
        or (public.is_staff() and public.patient_belongs_to_current_org(scp.patient_id))
      )
  )
);

drop policy if exists shared_care_profile_episode_bridge_manage on public.shared_care_profile_episode_bridge;
create policy shared_care_profile_episode_bridge_manage on public.shared_care_profile_episode_bridge
for all using (
  public.is_staff()
)
with check (
  public.is_staff()
);

drop policy if exists shared_care_profile_prescription_bridge_select on public.shared_care_profile_prescription_bridge;
create policy shared_care_profile_prescription_bridge_select on public.shared_care_profile_prescription_bridge
for select using (
  exists (
    select 1
    from public.shared_care_profile scp
    where scp.id = shared_care_profile_id
      and (
        public.is_current_patient(scp.patient_id)
        or (public.is_staff() and public.patient_belongs_to_current_org(scp.patient_id))
      )
  )
);

drop policy if exists shared_care_profile_prescription_bridge_manage on public.shared_care_profile_prescription_bridge;
create policy shared_care_profile_prescription_bridge_manage on public.shared_care_profile_prescription_bridge
for all using (
  public.is_staff()
)
with check (
  public.is_staff()
);

drop policy if exists shared_care_profile_select_by_patient_or_staff on public.shared_care_profile;
create policy shared_care_profile_select_by_patient_or_staff on public.shared_care_profile
for select using (
  public.is_current_patient(patient_id)
  or (public.is_staff() and public.patient_belongs_to_current_org(patient_id))
);

drop policy if exists shared_care_profile_manage_by_patient_or_staff on public.shared_care_profile;
create policy shared_care_profile_manage_by_patient_or_staff on public.shared_care_profile
for all using (
  public.is_current_patient(patient_id)
  or (public.is_staff() and public.patient_belongs_to_current_org(patient_id))
)
with check (
  public.is_current_patient(patient_id)
  or (public.is_staff() and public.patient_belongs_to_current_org(patient_id))
);

drop policy if exists medication_catalog_read_authenticated on public.medication_catalog;
create policy medication_catalog_read_authenticated on public.medication_catalog
for select using (auth.role() = 'authenticated');

drop policy if exists medication_catalog_manage_staff on public.medication_catalog;
create policy medication_catalog_manage_staff on public.medication_catalog
for all using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

drop policy if exists active_ingredient_read_authenticated on public.active_ingredient;
create policy active_ingredient_read_authenticated on public.active_ingredient
for select using (auth.role() = 'authenticated');

drop policy if exists active_ingredient_manage_staff on public.active_ingredient;
create policy active_ingredient_manage_staff on public.active_ingredient
for all using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

drop policy if exists medication_ingredient_map_read_authenticated on public.medication_ingredient_map;
create policy medication_ingredient_map_read_authenticated on public.medication_ingredient_map
for select using (auth.role() = 'authenticated');

drop policy if exists medication_ingredient_map_manage_staff on public.medication_ingredient_map;
create policy medication_ingredient_map_manage_staff on public.medication_ingredient_map
for all using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

drop policy if exists drug_interaction_rule_read_authenticated on public.drug_interaction_rule;
create policy drug_interaction_rule_read_authenticated on public.drug_interaction_rule
for select using (auth.role() = 'authenticated');

drop policy if exists drug_interaction_rule_manage_staff on public.drug_interaction_rule;
create policy drug_interaction_rule_manage_staff on public.drug_interaction_rule
for all using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

drop policy if exists drug_interaction_rule_detail_read_authenticated on public.drug_interaction_rule_detail;
create policy drug_interaction_rule_detail_read_authenticated on public.drug_interaction_rule_detail
for select using (auth.role() = 'authenticated');

drop policy if exists drug_interaction_rule_detail_manage_staff on public.drug_interaction_rule_detail;
create policy drug_interaction_rule_detail_manage_staff on public.drug_interaction_rule_detail
for all using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

drop policy if exists drug_combination_guidance_read_authenticated on public.drug_combination_guidance;
create policy drug_combination_guidance_read_authenticated on public.drug_combination_guidance
for select using (auth.role() = 'authenticated');

drop policy if exists drug_combination_guidance_manage_staff on public.drug_combination_guidance;
create policy drug_combination_guidance_manage_staff on public.drug_combination_guidance
for all using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

drop policy if exists drug_contraindication_read_authenticated on public.drug_contraindication;
create policy drug_contraindication_read_authenticated on public.drug_contraindication
for select using (auth.role() = 'authenticated');

drop policy if exists drug_contraindication_manage_staff on public.drug_contraindication;
create policy drug_contraindication_manage_staff on public.drug_contraindication
for all using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

drop policy if exists drug_allergy_cross_reactivity_read_authenticated on public.drug_allergy_cross_reactivity;
create policy drug_allergy_cross_reactivity_read_authenticated on public.drug_allergy_cross_reactivity
for select using (auth.role() = 'authenticated');

drop policy if exists drug_allergy_cross_reactivity_manage_staff on public.drug_allergy_cross_reactivity;
create policy drug_allergy_cross_reactivity_manage_staff on public.drug_allergy_cross_reactivity
for all using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

drop policy if exists consent_grant_select_self_family_hospital on public.consent_grant;
create policy consent_grant_select_self_family_hospital on public.consent_grant
for select using (
  (public.is_patient_actor() and (public.is_current_patient(grantor_patient_id) or public.is_current_patient(subject_patient_id)))
  or (public.is_patient_actor() and grantee_type = 'patient'::public.consent_grantee_type_enum and public.is_current_patient(grantee_patient_id))
  or (public.is_staff() and grantee_type = 'organization'::public.consent_grantee_type_enum and grantee_organization_id is not null and public.belongs_to_current_org(grantee_organization_id))
);

drop policy if exists consent_grant_insert_patient_self on public.consent_grant;
create policy consent_grant_insert_patient_self on public.consent_grant
for insert with check (
  public.is_patient_actor()
  and public.is_current_patient(grantor_patient_id)
  and (
    public.is_current_patient(subject_patient_id)
    or exists (
      select 1
      from public.care_profile_bridge b
      where b.owner_patient_id = grantor_patient_id
        and b.subject_patient_id = subject_patient_id
        and b.is_active = true
    )
  )
);

drop policy if exists consent_grant_update_patient_self on public.consent_grant;
create policy consent_grant_update_patient_self on public.consent_grant
for update using (
  public.is_patient_actor()
  and public.is_current_patient(grantor_patient_id)
)
with check (
  public.is_patient_actor()
  and public.is_current_patient(grantor_patient_id)
);

drop policy if exists care_profile_bridge_select_lanes on public.care_profile_bridge;
create policy care_profile_bridge_select_lanes on public.care_profile_bridge
for select using (
  public.can_read_care_profile_lane(lane, owner_patient_id, subject_patient_id, organization_id)
);

drop policy if exists care_profile_bridge_insert_lanes on public.care_profile_bridge;
create policy care_profile_bridge_insert_lanes on public.care_profile_bridge
for insert with check (
  public.can_write_care_profile_lane(lane, owner_patient_id, subject_patient_id, organization_id)
);

drop policy if exists care_profile_bridge_update_lanes on public.care_profile_bridge;
create policy care_profile_bridge_update_lanes on public.care_profile_bridge
for update using (
  public.can_write_care_profile_lane(lane, owner_patient_id, subject_patient_id, organization_id)
)
with check (
  public.can_write_care_profile_lane(lane, owner_patient_id, subject_patient_id, organization_id)
);

drop policy if exists interaction_alert_log_select_lanes on public.drug_interaction_alert_log;
create policy interaction_alert_log_select_lanes on public.drug_interaction_alert_log
for select using (
  public.can_read_care_profile_lane(lane, owner_patient_id, subject_patient_id, organization_id)
);

drop policy if exists interaction_alert_log_insert_lanes on public.drug_interaction_alert_log;
create policy interaction_alert_log_insert_lanes on public.drug_interaction_alert_log
for insert with check (
  public.can_write_care_profile_lane(lane, owner_patient_id, subject_patient_id, organization_id)
);

drop policy if exists interaction_alert_log_update_lanes on public.drug_interaction_alert_log;
create policy interaction_alert_log_update_lanes on public.drug_interaction_alert_log
for update using (
  public.can_write_care_profile_lane(lane, owner_patient_id, subject_patient_id, organization_id)
)
with check (
  public.can_write_care_profile_lane(lane, owner_patient_id, subject_patient_id, organization_id)
);

-- ---------------------------------------------------------
-- 8) Seed bridge from medication_master (safe no-op on conflicts)
-- ---------------------------------------------------------

insert into public.medication_catalog (
  medication_master_id,
  catalog_code,
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
select
  mm.id,
  mm.standard_code,
  mm.generic_name,
  mm.brand_name,
  mm.strength_text,
  mm.dosage_form,
  mm.route,
  mm.atc_class,
  mm.is_high_risk,
  mm.is_controlled_substance,
  mm.status
from public.medication_master mm
on conflict do nothing;

commit;
