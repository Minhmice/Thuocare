begin;

alter table public.personal_medication
  drop constraint if exists personal_medication_custom_or_catalog;

commit;
