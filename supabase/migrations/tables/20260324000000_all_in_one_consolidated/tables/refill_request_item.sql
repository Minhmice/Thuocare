-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.refill_request_item
-- Note: canonical execution order still lives in the original migration file.
create table public.refill_request_item (
  id uuid primary key default gen_random_uuid(),
  refill_request_id uuid not null references public.refill_request(id) on delete cascade,
  prescription_item_id uuid not null references public.prescription_item(id) on delete restrict,
  requested_quantity numeric(12,4),
  status public.refill_request_item_status_enum not null default 'pending',
  approved_quantity numeric(12,4),
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refill_request_item_unique unique (refill_request_id, prescription_item_id),
  constraint refill_request_item_requested_qty_positive
    check (requested_quantity is null or requested_quantity > 0),
  constraint refill_request_item_approved_qty_positive
    check (approved_quantity is null or approved_quantity > 0)
);

