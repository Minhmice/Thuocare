begin;

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

commit;

