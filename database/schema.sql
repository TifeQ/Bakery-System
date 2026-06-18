-- ============================================
-- BlazeSolutions Bakery System - Schema
-- Author: Boluwatife
-- Date: June 2026
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text not null,
  phone text,
  role text not null default 'Customer'
    check (role in ('Customer', 'Kitchen Staff', 'Admin')),
  delivery_address text,
  created_at timestamptz not null default now()
);

-- Products table
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null
    check (category in ('Bread', 'Pastries', 'Custom Cakes')),
  description text,
  price integer not null,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- Orders table
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete restrict,
  status text not null default 'Pending'
    check (status in ('Pending', 'Baking', 'Ready for Pickup', 'Out for Delivery', 'Completed')),
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Paid', 'Failed')),
  total_price integer not null,
  delivery_type text not null default 'Pickup'
    check (delivery_type in ('Pickup', 'Delivery')),
  delivery_address text,
  scheduled_time timestamptz,
  notes text,
  customer_name text,
  customer_email text,
  customer_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items table
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price integer not null,
  custom_request text,
  created_at timestamptz not null default now()
);

-- Inventory table
create table inventory (
  id uuid primary key default uuid_generate_v4(),
  ingredient_name text not null unique,
  unit text not null,
  current_stock integer not null default 0,
  safety_threshold integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Auto-update triggers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at();

create trigger inventory_updated_at
  before update on inventory
  for each row
  execute function update_updated_at();
