-- =============================================================================
-- Migration: Add sort_order to products
-- =============================================================================
--
-- Lets org admins control the display order of products on the storefront.
-- Lower sort_order appears first.
--
-- Existing products are seeded with gap-based sort_order (0, 10, 20, ...)
-- ordered by their creation date (oldest = lowest sort_order = top of list)
-- so the initial state matches what admins were seeing before.
-- =============================================================================

alter table public.products
  add column if not exists sort_order integer not null default 0;

-- Backfill existing products with gap-based sort_order, per-org, oldest first.
with ranked as (
  select
    id,
    row_number() over (
      partition by organization_id
      order by created_at asc
    ) as rn
  from public.products
)
update public.products p
   set sort_order = (ranked.rn - 1) * 10
  from ranked
 where p.id = ranked.id
   and p.sort_order = 0;

-- Index supports both "list by sort order" and per-org queries
create index if not exists idx_products_org_sort
  on public.products(organization_id, sort_order);
