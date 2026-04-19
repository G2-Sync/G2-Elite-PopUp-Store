-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_cents int not null check (price_cents >= 0),
  category_id uuid references categories(id) on delete set null,
  stock int default 0 check (stock >= 0),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_category on products(category_id);
create index idx_products_active on products(is_active) where is_active = true;

-- Product images
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  is_primary boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index idx_product_images_product on product_images(product_id);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_email text not null,
  customer_name text,
  shipping_address jsonb,
  subtotal_cents int not null,
  tax_cents int default 0,
  total_cents int not null,
  status text not null default 'pending' check (status in ('pending','paid','shipped','fulfilled','cancelled','refunded')),
  payment_provider text check (payment_provider in ('stripe','paypal','square')),
  payment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_orders_email on orders(customer_email);
create index idx_orders_status on orders(status);

-- Order items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity int not null check (quantity > 0),
  unit_price_cents int not null,
  created_at timestamptz default now()
);

create index idx_order_items_order on order_items(order_id);

-- Updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- RLS policies
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Public read for active products and categories
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read active products" on products for select using (is_active = true);
create policy "Public can read product images" on product_images for select using (true);

-- Orders: service role only (customers identified by email — handled server-side)
create policy "Service role full access orders" on orders for all using (auth.role() = 'service_role');
create policy "Service role full access order_items" on order_items for all using (auth.role() = 'service_role');
