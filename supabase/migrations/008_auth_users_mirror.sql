-- Espelho auth.users → public.users (idempotente — cria ou atualiza)

do $$ begin
  create type public.academy_role as enum ('student', 'admin');
exception
  when duplicate_object then null;
end $$;

-- Legado: renomeia public.profiles → public.users se existir
do $$
begin
  if to_regclass('public.profiles') is not null
     and to_regclass('public.users') is null then
    alter table public.profiles rename to users;
    alter index if exists profiles_role_idx rename to users_role_idx;
    alter index if exists profiles_email_idx rename to users_email_idx;
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  role public.academy_role not null default 'student',
  auth_created_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists avatar_url text,
  add column if not exists phone text,
  add column if not exists auth_created_at timestamptz,
  add column if not exists email_confirmed_at timestamptz,
  add column if not exists last_sign_in_at timestamptz;

comment on table public.users is
  'Espelho de auth.users para RLS e consultas no schema public. Sincronizado por trigger.';

create index if not exists users_role_idx on public.users (role);
create index if not exists users_email_idx on public.users (lower(trim(email)));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
drop trigger if exists profiles_set_updated_at on public.users;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create or replace function public.sync_user_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    avatar_url,
    phone,
    auth_created_at,
    email_confirmed_at,
    last_sign_in_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    new.created_at,
    new.email_confirmed_at,
    new.last_sign_in_at
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
        phone = coalesce(excluded.phone, public.users.phone),
        auth_created_at = excluded.auth_created_at,
        email_confirmed_at = excluded.email_confirmed_at,
        last_sign_in_at = excluded.last_sign_in_at,
        updated_at = now();

  return new;
end;
$$;

drop function if exists public.sync_profile_from_auth_user();

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.sync_user_from_auth();

create trigger on_auth_user_updated
after update of email, phone, email_confirmed_at, last_sign_in_at, raw_user_meta_data
on auth.users
for each row execute function public.sync_user_from_auth();

insert into public.users (
  id,
  email,
  full_name,
  avatar_url,
  phone,
  auth_created_at,
  email_confirmed_at,
  last_sign_in_at
)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name'
  ),
  u.raw_user_meta_data ->> 'avatar_url',
  coalesce(u.phone, u.raw_user_meta_data ->> 'phone'),
  u.created_at,
  u.email_confirmed_at,
  u.last_sign_in_at
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      phone = coalesce(excluded.phone, public.users.phone),
      auth_created_at = excluded.auth_created_at,
      email_confirmed_at = excluded.email_confirmed_at,
      last_sign_in_at = excluded.last_sign_in_at,
      updated_at = now();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.users enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.users;
drop policy if exists "profiles_update_own" on public.users;
drop policy if exists "profiles_admin_manage" on public.users;
drop policy if exists "users_select_own_or_admin" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_admin_manage" on public.users;

create policy "users_select_own_or_admin"
on public.users
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "users_update_own"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "users_admin_manage"
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
