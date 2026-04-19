-- =============================================================================
-- Migration: Seed sample org for local development
-- =============================================================================
-- Creates the "acme" org with 3 categories and 3 sample products.
-- No auth.users seed needed — the org can be claimed by the first super-admin
-- via an organization_members insert after login.
-- =============================================================================

-- Sample org
insert into public.organizations (slug, name, tagline, primary_color, accent_color, font_family, contact_email, is_active)
values (
  'acme',
  'Acme Pop-Up',
  'Limited drops from the Acme collective',
  '#0F172A',
  '#F59E0B',
  'Inter',
  'admin@acme.example',
  true
);

-- Sample categories for acme
insert into public.categories (organization_id, name, slug, sort_order)
  select id, 'Apparel', 'apparel', 1 from public.organizations where slug = 'acme';

insert into public.categories (organization_id, name, slug, sort_order)
  select id, 'Accessories', 'accessories', 2 from public.organizations where slug = 'acme';

insert into public.categories (organization_id, name, slug, sort_order)
  select id, 'Art & Prints', 'art', 3 from public.organizations where slug = 'acme';

-- Sample products
insert into public.products (organization_id, category_id, name, slug, description, price_cents, stock)
  select o.id, c.id, 'Classic Logo Tee', 'classic-logo-tee', 'Premium cotton tee with embroidered logo.', 3500, 25
  from public.organizations o
  join public.categories c on c.organization_id = o.id
  where o.slug = 'acme' and c.slug = 'apparel';

insert into public.products (organization_id, category_id, name, slug, description, price_cents, stock)
  select o.id, c.id, 'Enamel Pin Set', 'enamel-pin-set', 'Set of 3 collectible enamel pins.', 1500, 50
  from public.organizations o
  join public.categories c on c.organization_id = o.id
  where o.slug = 'acme' and c.slug = 'accessories';

insert into public.products (organization_id, category_id, name, slug, description, price_cents, stock)
  select o.id, c.id, 'Limited Print 01', 'limited-print-01', 'Numbered giclée print, 12x18".', 4500, 10
  from public.organizations o
  join public.categories c on c.organization_id = o.id
  where o.slug = 'acme' and c.slug = 'art';
