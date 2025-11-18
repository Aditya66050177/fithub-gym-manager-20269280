-- FitHub Database Setup SQL
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user roles enum
do $$ begin
  create type public.app_role as enum ('admin', 'owner', 'user');
exception
  when duplicate_object then null;
end $$;

-- Create user_roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id)
);

-- Create gym_owners table
create table if not exists public.gym_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create gyms table
create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  photos text[],
  location text not null,
  timings text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create plans table
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references public.gyms(id) on delete cascade not null,
  name text not null,
  duration_months integer not null,
  price decimal(10,2) not null,
  features jsonb,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create memberships table
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id uuid references public.plans(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  membership_id uuid references public.memberships(id) on delete cascade not null,
  amount decimal(10,2) not null,
  payment_method text not null,
  payment_status text not null check (payment_status in ('pending', 'completed', 'failed')),
  transaction_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create attendance table
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  gym_id uuid references public.gyms(id) on delete cascade not null,
  check_in timestamp with time zone default timezone('utc'::text, now()) not null,
  check_out timestamp with time zone
);

-- Create security definer function to check user role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.gym_owners enable row level security;
alter table public.gyms enable row level security;
alter table public.plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view their own role" on public.user_roles;
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
drop policy if exists "Users can create gym owner requests" on public.gym_owners;
drop policy if exists "Users can view own requests" on public.gym_owners;
drop policy if exists "Admins can view all gym owner requests" on public.gym_owners;
drop policy if exists "Admins can update gym owner requests" on public.gym_owners;
drop policy if exists "Anyone can view gyms" on public.gyms;
drop policy if exists "Owners can create gyms" on public.gyms;
drop policy if exists "Owners can update their gyms" on public.gyms;
drop policy if exists "Anyone can view active plans" on public.plans;
drop policy if exists "Gym owners can manage their plans" on public.plans;
drop policy if exists "Users can view own memberships" on public.memberships;
drop policy if exists "Admins can view all memberships" on public.memberships;
drop policy if exists "Users can view own payments" on public.payments;
drop policy if exists "Admins can view all payments" on public.payments;
drop policy if exists "Users can view own attendance" on public.attendance;
drop policy if exists "Gym owners can view their gym attendance" on public.attendance;

-- RLS Policies for profiles
create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- RLS Policies for user_roles
create policy "Users can view their own role"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
  on public.user_roles for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for gym_owners
create policy "Users can create gym owner requests"
  on public.gym_owners for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own requests"
  on public.gym_owners for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all gym owner requests"
  on public.gym_owners for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update gym owner requests"
  on public.gym_owners for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for gyms
create policy "Anyone can view gyms"
  on public.gyms for select
  to authenticated
  using (true);

create policy "Owners can create gyms"
  on public.gyms for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin'));

create policy "Owners can update their gyms"
  on public.gyms for update
  to authenticated
  using (auth.uid() = owner_id or public.has_role(auth.uid(), 'admin'));

-- RLS Policies for plans
create policy "Anyone can view active plans"
  on public.plans for select
  to authenticated
  using (active = true or public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin'));

create policy "Gym owners can manage their plans"
  on public.plans for all
  to authenticated
  using (
    exists (
      select 1 from public.gyms
      where gyms.id = plans.gym_id
      and gyms.owner_id = auth.uid()
    ) or public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for memberships
create policy "Users can view own memberships"
  on public.memberships for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all memberships"
  on public.memberships for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payments
create policy "Users can view own payments"
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all payments"
  on public.payments for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance
create policy "Users can view own attendance"
  on public.attendance for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Gym owners can view their gym attendance"
  on public.attendance for select
  to authenticated
  using (
    exists (
      select 1 from public.gyms
      where gyms.id = attendance.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', null)
  );
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Trigger to call the function on user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
