begin;

alter table public.patient
  alter column organization_id drop not null;

commit;

