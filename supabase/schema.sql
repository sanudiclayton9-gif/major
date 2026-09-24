-- Run this in Supabase Studio -> SQL Editor -> New query -> Run

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  price numeric not null,
  stock integer not null default 0,
  sizes text[] default '{}',
  images text[] default '{}',
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,
  total numeric not null,
  status text not null default 'pending', -- pending | paid | delivered | cancelled
  customer_phone text not null,
  customer_name text,
  measurements text,
  paynow_poll_url text,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  text text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: public can read products/comments, insert comments/reviews/orders.
-- Only server-side code using the service role key can write products or update orders,
-- so the ADMIN_PASSWORD-gated admin routes are the only way to manage the catalog.

alter table products enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;
alter table comments enable row level security;

create policy "public read products" on products for select using (true);
create policy "public read comments" on comments for select using (true);
create policy "public insert comments" on comments for insert with check (true);
create policy "public insert orders" on orders for insert with check (true);
create policy "public insert reviews" on reviews for insert with check (true);

-- No public select/update/delete policies on orders/reviews/products beyond the above:
-- product writes, order status updates, and reading reviews all go through server
-- routes using the Supabase service role key, which bypasses RLS entirely.

create index if not exists comments_product_id_idx on comments(product_id);
