-- ============================================================================
-- WARDAN (وردان) — Supabase Database Schema & Row Level Security (RLS)
-- Project: https://pubyvzeaexyljnavcmzl.supabase.co
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pubyvzeaexyljnavcmzl/sql/new
-- ============================================================================

-- 1. Staff Profiles Table (جدول حسابات الموظفين)
create table if not exists public.staff_profiles (
  id text primary key,
  email text unique not null,
  name_ar text not null,
  name_en text not null,
  avatar text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_profiles_email on public.staff_profiles (email);

alter table public.staff_profiles enable row level security;

grant select, insert, update, delete on table public.staff_profiles to anon, authenticated;

drop policy if exists "Allow staff profiles access" on public.staff_profiles;
create policy "Allow staff profiles access"
  on public.staff_profiles
  for all
  to anon, authenticated
  using ( true )
  with check ( true );

-- 2. Orders Table (جدول الطلبيات)
create table if not exists public.orders (
  id text primary key,
  customer_name_ar text not null,
  customer_name_en text not null,
  customer_phone text not null default '',
  order_type_ar text not null,
  order_type_en text not null,
  thumbnail text not null default '',
  status text not null default 'preparing',
  payment_status text not null default 'paid',
  has_gift_card boolean not null default false,
  is_completed boolean not null default false,
  is_urgent boolean not null default false,
  fulfillment_type text not null default 'pickup',
  pickup_date text,
  pickup_time text,
  delivery_time_ar text not null default '',
  delivery_time_en text not null default '',
  delivery_area_ar text not null default '',
  delivery_area_en text not null default '',
  amount_omr numeric(10, 2) not null default 0,
  card_message_ar text,
  card_message_en text,
  notes_ar text,
  notes_en text,
  florist_ar text not null default 'شهد',
  florist_en text not null default 'Shahad',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_is_completed on public.orders (is_completed);
create index if not exists idx_orders_fulfillment_type on public.orders (fulfillment_type);
create index if not exists idx_orders_pickup_date on public.orders (pickup_date);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

alter table public.orders enable row level security;

grant select, insert, update, delete on table public.orders to anon, authenticated;

drop policy if exists "Allow orders access for staff" on public.orders;
create policy "Allow orders access for staff"
  on public.orders
  for all
  to anon, authenticated
  using ( true )
  with check ( true );
