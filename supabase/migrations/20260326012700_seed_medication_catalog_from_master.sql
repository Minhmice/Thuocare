begin;

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

