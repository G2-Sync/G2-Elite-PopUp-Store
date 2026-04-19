-- =============================================================================
-- Migration: Multi-Tenant Schema
-- =============================================================================
--
-- TENANCY MODEL
-- -------------
-- Each "organization" is an isolated tenant. All tenant-scoped tables carry an
-- `organization_id` foreign key so a single Postgres instance hosts N orgs with
-- no data bleed.
--
-- Auth tiers:
--   1. Public / anonymous  — can read active orgs, active products, categories,
--                            product images. Cannot touch anything sensitive.
--   2. Organization member — role='admin' only (Phase 1). Can CRUD their own
--                            org's data (branding, products, categories, orders,
--                            payment accounts). Determined via organization_members.
--   3. Super admin         — listed in super_admins. Unrestricted access to all
--                            tables, including cross-org reads/writes.
--
-- RLS helper functions (SECURITY DEFINER so they execute with elevated trust):
--   auth_user_org_id()  → uuid of the first org the current user belongs to
--   is_super_admin()    → true if current auth.uid() is in super_admins
--
-- Service-role clients (webhooks, background jobs) bypass RLS by design —
-- Postgres grants this when connecting with the service role key. No extra
-- policies needed; the note is here for clarity.
--
-- Indexes: every tenant-scoped table has idx_{table}_org on (organization_id).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.auth_user_org_id()
returns uuid
language sql
stable
security definer
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.super_admins where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  tagline         text,
  logo_url        text,
  hero_image_url  text,
  primary_color   text not null default '#0F172A',
  accent_color    text not null default '#F59E0B',
  font_family     text not null default 'Inter',
  contact_email   text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- super_admins
-- ---------------------------------------------------------------------------

create table public.super_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------

create table public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'admin' check (role in ('admin')),
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index idx_organization_members_org on public.organization_members(organization_id);
create index idx_organization_members_user on public.organization_members(user_id);

-- ---------------------------------------------------------------------------
-- payment_accounts
-- ---------------------------------------------------------------------------

create table public.payment_accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider        text not null check (provider in ('stripe', 'paypal', 'square')),
  account_id      text not null,
  access_token    text,
  refresh_token   text,
  scope           text,
  expires_at      timestamptz,
  is_active       boolean not null default true,
  connected_at    timestamptz not null default now(),
  unique (organization_id, provider)
);

create index idx_payment_accounts_org on public.payment_accounts(organization_id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  slug            text not null,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (organization_id, slug)
);

create index idx_categories_org on public.categories(organization_id);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  slug            text not null,
  description     text,
  price_cents     integer not null check (price_cents >= 0),
  category_id     uuid references public.categories(id) on delete set null,
  stock           integer not null default 0 check (stock >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, slug)
);

create index idx_products_org on public.products(organization_id);
create index idx_products_category on public.products(category_id);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------

create table public.product_images (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url             text not null,
  is_primary      boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_product_images_org on public.product_images(organization_id);
create index idx_product_images_product on public.product_images(product_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  order_number     text not null unique,
  customer_email   text not null,
  customer_name    text,
  shipping_address jsonb,
  subtotal_cents   integer not null check (subtotal_cents >= 0),
  tax_cents        integer not null default 0 check (tax_cents >= 0),
  total_cents      integer not null check (total_cents >= 0),
  status           text not null default 'pending'
                     check (status in ('pending','paid','shipped','fulfilled','cancelled','refunded')),
  payment_provider text check (payment_provider in ('stripe','paypal','square')),
  payment_id       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_orders_org on public.orders(organization_id);
create index idx_orders_status on public.orders(organization_id, status);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  product_name    text not null,
  quantity        integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at      timestamptz not null default now()
);

create index idx_order_items_order on public.order_items(order_id);

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.organizations        enable row level security;
alter table public.super_admins         enable row level security;
alter table public.organization_members enable row level security;
alter table public.payment_accounts     enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_images       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;

-- ---------------------------------------------------------------------------
-- RLS Policies: organizations
-- ---------------------------------------------------------------------------

-- Anonymous / public: read active orgs (storefront needs org branding by slug)
create policy "orgs_public_select"
  on public.organizations for select
  using (is_active = true);

-- Super admin: full access
create policy "orgs_super_admin_all"
  on public.organizations for all
  using (public.is_super_admin());

-- Members: read their own org (supplements public select — catches inactive orgs)
create policy "orgs_member_select"
  on public.organizations for select
  using (id = public.auth_user_org_id());

-- Members: update their own org branding/settings
create policy "orgs_member_update"
  on public.organizations for update
  using (id = public.auth_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS Policies: super_admins
-- ---------------------------------------------------------------------------

create policy "super_admins_self_all"
  on public.super_admins for all
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- RLS Policies: organization_members
-- ---------------------------------------------------------------------------

create policy "org_members_super_admin_all"
  on public.organization_members for all
  using (public.is_super_admin());

create policy "org_members_self_select"
  on public.organization_members for select
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: payment_accounts
-- ---------------------------------------------------------------------------

create policy "payment_accounts_super_admin_all"
  on public.payment_accounts for all
  using (public.is_super_admin());

create policy "payment_accounts_member_all"
  on public.payment_accounts for all
  using (organization_id = public.auth_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS Policies: categories
-- ---------------------------------------------------------------------------

-- Public select — storefronts always filter by org_id in WHERE clause
create policy "categories_public_select"
  on public.categories for select
  using (true);

-- Members full access to their org's categories
create policy "categories_member_all"
  on public.categories for all
  using (organization_id = public.auth_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS Policies: products
-- ---------------------------------------------------------------------------

-- Public: only active products
create policy "products_public_select"
  on public.products for select
  using (is_active = true);

-- Members: full access to own org
create policy "products_member_all"
  on public.products for all
  using (organization_id = public.auth_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS Policies: product_images
-- ---------------------------------------------------------------------------

create policy "product_images_public_select"
  on public.product_images for select
  using (true);

create policy "product_images_member_all"
  on public.product_images for all
  using (organization_id = public.auth_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS Policies: orders
-- ---------------------------------------------------------------------------

-- Members can read/write their org's orders
create policy "orders_member_all"
  on public.orders for all
  using (organization_id = public.auth_user_org_id());

-- Super admin full access
create policy "orders_super_admin_all"
  on public.orders for all
  using (public.is_super_admin());

-- Permissive service-role insert (webhook fulfillment — service role bypasses RLS,
-- but this makes the intent explicit)
create policy "orders_service_role_insert"
  on public.orders for insert
  with check (true);

-- ---------------------------------------------------------------------------
-- RLS Policies: order_items
-- ---------------------------------------------------------------------------

-- Members can access order_items where the parent order belongs to their org
create policy "order_items_member_all"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.organization_id = public.auth_user_org_id()
    )
  );

create policy "order_items_super_admin_all"
  on public.order_items for all
  using (public.is_super_admin());

create policy "order_items_service_role_insert"
  on public.order_items for insert
  with check (true);
