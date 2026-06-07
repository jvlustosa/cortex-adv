-- Admins do painel /admin (e-mail @chatjuridico.com.br + registro ativo aqui)

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists admin_users_email_lower_idx
  on public.admin_users (lower(trim(email)));

alter table public.admin_users enable row level security;

-- Sem policies: leitura/escrita apenas via service role nas API routes.

comment on table public.admin_users is
  'E-mails autorizados no painel /admin. Requer domínio @chatjuridico.com.br no login.';
