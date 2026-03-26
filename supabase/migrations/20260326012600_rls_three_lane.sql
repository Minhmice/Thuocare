begin;

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

commit;

