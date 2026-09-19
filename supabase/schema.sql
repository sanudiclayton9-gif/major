create extension if not exists "uuid-ossp";

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric(10,2) not null,
  stock integer not null default 0,
  sizes text[] default '{}',
  images text[] default '{}',
  description text default '',
  embedding vector(1536),
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  items jsonb not null default '[]',
  total numeric(10,2) not null default 0,
  status text not null default 'pending',
  customer_phone text,
  paynow_poll_url text,
  created_at timestamptz default now()
);

-- Enable pgvector in Supabase before using the embedding column:
-- create extension if not exists vector;