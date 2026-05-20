-- =============================================================================
-- Migration: Product sizes
-- =============================================================================
--
-- Adds optional size selection to products.
--
-- - products.has_sizes (boolean): if true, customers must pick a size from a
--   fixed list (X-Small, Small, Medium, Large, X-Large) before adding to cart.
-- - order_items.size (text, nullable): the chosen size for this line item,
--   or null if the product didn't require a size.
--
-- The size list itself is enforced in application code (not via a CHECK
-- constraint) so it's easy to extend later without a migration.
-- =============================================================================

alter table public.products
  add column if not exists has_sizes boolean not null default false;

alter table public.order_items
  add column if not exists size text;
