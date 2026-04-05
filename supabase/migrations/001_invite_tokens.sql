-- Convites por token (validação via service role na API; sem políticas públicas)
create table if not exists public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  label text,
  max_uses int not null default 1 check (max_uses >= 1),
  used_count int not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.invite_tokens is 'Tokens de convite para cadastro na área de membros.';

alter table public.invite_tokens enable row level security;

-- Sem políticas para anon/authenticated: apenas service role acessa.
-- Inserir tokens pelo SQL Editor ou painel com role service.
