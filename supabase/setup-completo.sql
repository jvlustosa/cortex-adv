-- =============================================================================
-- Claude Academy · Setup completo Supabase
-- Projeto: chat-juridico-claude-academy (claudeacademy.chatjuridico.com.br)
--
-- COMO USAR
-- 1. Crie um projeto em https://supabase.com (região sa-east-1 recomendada)
-- 2. Authentication → Providers → Email: habilitado (necessário p/ magic link)
-- 3. Authentication → Settings:
--      • Enable email signups: DESLIGADO (cadastro só via API + convite;
--        login por magic link usa shouldCreateUser:false, só contas já criadas)
--      • Confirm email: opcional (API usa email_confirm: true no admin.createUser)
-- 4. Authentication → URL Configuration:
--      Site URL:     https://claudeacademy.chatjuridico.com.br
--      Redirect URLs (magic link, recuperação e OAuth):
--        https://claudeacademy.chatjuridico.com.br/auth/confirm
--        https://claudeacademy.chatjuridico.com.br/auth/callback
--        http://localhost:3000/auth/confirm
--        http://localhost:3000/auth/callback
-- 4b. Authentication → Email Templates — usar {{ .TokenHash }} (NÃO ConfirmationURL),
--     senão o link cai como #access_token na raiz e o SSR não enxerga a sessão:
--      • Magic Link:
--          {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/area-de-membros
--      • Reset Password:
--          {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/atualizar-senha
-- 5. Cole e execute ESTE arquivo no SQL Editor (Run)
-- 6. Settings → API: copie URL, anon key e service_role para a Vercel / .env.local
--
-- Variáveis de ambiente (app Next.js):
--   NEXT_PUBLIC_SUPABASE_URL=
--   NEXT_PUBLIC_SUPABASE_ANON_KEY=
--   SUPABASE_SERVICE_ROLE_KEY=
--   NEXT_PUBLIC_SITE_URL=https://claudeacademy.chatjuridico.com.br
--   NEXT_PUBLIC_SUPABASE_ENABLED=true          (dev local)
-- =============================================================================

-- ─── Extensões ───────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── Espelho auth.users → public.users ──────────────────────────────────────

do $$ begin
  create type public.academy_role as enum ('student', 'admin');
exception
  when duplicate_object then null;
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
on conflict (id) do nothing;

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

-- ─── Convites (cadastro /signup) ───────────────────────────────────────────

create table if not exists public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  label text,
  max_uses int not null default 1 check (max_uses >= 1),
  used_count int not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  recipient_name text,
  recipient_email text,
  recipient_title text check (recipient_title in ('dr', 'dra')),
  constraint invite_tokens_used_lte_max check (used_count <= max_uses)
);

comment on table public.invite_tokens is
  'Tokens de convite para cadastro na área de membros. Acesso apenas service role + RPC interna.';

create index if not exists invite_tokens_token_lower_idx
  on public.invite_tokens (lower(trim(token)));

alter table public.invite_tokens enable row level security;

-- Sem policies: anon/authenticated não leem a tabela diretamente.

-- ─── Certificados (validação pública /validar/[code]) ───────────────────────

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  recipient_name text not null,
  course_title text not null default 'Claude Academy: IA generativa para advogados',
  workload_hours int not null default 12 check (workload_hours > 0),
  issued_at date not null default current_date,
  revoked_at timestamptz,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.certificates is
  'Certificados digitais. Verificação pública somente via verify_certificate().';

create index if not exists certificates_code_lower_idx
  on public.certificates (lower(trim(code)));

create index if not exists certificates_user_id_idx
  on public.certificates (user_id)
  where user_id is not null;

alter table public.certificates enable row level security;

-- Sem SELECT direto para anon: evita enumeração em massa.

-- ─── RPC: verificar certificado (público) ───────────────────────────────────

create or replace function public.verify_certificate(p_code text)
returns table (
  code text,
  recipient_name text,
  course_title text,
  workload_hours int,
  issued_at date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    c.code,
    c.recipient_name,
    c.course_title,
    c.workload_hours,
    c.issued_at
  from public.certificates c
  where lower(trim(c.code)) = lower(trim(p_code))
    and c.revoked_at is null;
end;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

comment on function public.verify_certificate(text) is
  'Retorna dados públicos de um certificado ativo pelo código CA-YYYY-NNNN.';

-- ─── RPC: consumir convite (uso interno, service role na API) ───────────────
-- Opcional: centraliza validação + incremento atômico do used_count.

create or replace function public.consume_invite_token(p_token text)
returns table (
  id uuid,
  max_uses int,
  used_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.invite_tokens%rowtype;
begin
  select * into v_row
  from public.invite_tokens t
  where lower(trim(t.token)) = lower(trim(p_token))
  for update;

  if not found then
    return;
  end if;

  if not v_row.active then
    raise exception 'invite_inactive';
  end if;

  if v_row.expires_at is not null and v_row.expires_at < now() then
    raise exception 'invite_expired';
  end if;

  if v_row.used_count >= v_row.max_uses then
    raise exception 'invite_exhausted';
  end if;

  update public.invite_tokens
  set used_count = used_count + 1
  where invite_tokens.id = v_row.id
  returning invite_tokens.id, invite_tokens.max_uses, invite_tokens.used_count
  into id, max_uses, used_count;

  return next;
end;
$$;

revoke all on function public.consume_invite_token(text) from public;
revoke execute on function public.consume_invite_token(text) from anon, authenticated;
-- Só a service role executa, via backend Next (/api/auth/signup com admin client).
-- O revoke de public NÃO basta: o Supabase concede execute a anon/authenticated por
-- default privileges na criação da função; por isso o revoke explícito desses roles.

comment on function public.consume_invite_token(text) is
  'Incrementa used_count de forma atômica. Chamada pela API /api/auth/signup com service role.';

-- ─── Aulas: overrides, views, feedback (003_course_admin.sql) ───────────────

create table if not exists public.lesson_overrides (
  module_id text not null,
  lesson_id text not null,
  youtube_id text,
  tella text,
  duration text,
  title text,
  description text,
  published boolean not null default true,
  order_index integer,
  updated_at timestamptz not null default now(),
  primary key (module_id, lesson_id)
);

-- Ordena aulas em runtime (reorder por arrastar no painel) — migration 013.
create index if not exists lesson_overrides_module_order_idx
  on public.lesson_overrides (module_id, order_index);

create table if not exists public.lesson_views (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  lesson_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index if not exists lesson_views_lesson_idx
  on public.lesson_views (module_id, lesson_id);

create table if not exists public.lesson_feedback (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  lesson_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (user_id, module_id, lesson_id)
);

create index if not exists lesson_feedback_lesson_idx
  on public.lesson_feedback (module_id, lesson_id);

alter table public.lesson_overrides enable row level security;
alter table public.lesson_views enable row level security;
alter table public.lesson_feedback enable row level security;

-- ─── Admins do painel /admin (004_admin_users.sql) ──────────────────────────

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists admin_users_email_lower_idx
  on public.admin_users (lower(trim(email)));

alter table public.admin_users enable row level security;

comment on table public.admin_users is
  'E-mails autorizados no painel /admin (@chatjuridico.com.br ou @escritoriovilasboas.com).';

-- ─── Seeds de desenvolvimento / demo ────────────────────────────────────────

insert into public.admin_users (email, active)
values
  ('vitor@chatjuridico.com.br', true),
  ('marcelo@chatjuridico.com.br', true),
  ('guilherme@chatjuridico.com.br', true),
  ('otavio@chatjuridico.com.br', true),
  ('marcos@escritoriovilasboas.com', true)
on conflict (email) do update set active = excluded.active;

insert into public.invite_tokens (token, label, max_uses, expires_at)
values
  ('CONVITE-DEMO-2026', 'Demo local · uso único', 10, '2027-12-31 23:59:59+00'),
  ('TURMA-01-VIP', 'Primeira turma · VIP', 1, null)
on conflict (token) do nothing;

insert into public.certificates (code, recipient_name, issued_at)
values
  ('CA-2026-48271', 'Dra. Maria Silva', '2026-06-01'),
  ('CA-2026-93516', 'Dr. João Souza', current_date)
on conflict (code) do nothing;

-- ─── Operações úteis (referência, não executar em bloco) ───────────────────
--
-- Emitir certificado:
--   insert into public.certificates (code, recipient_name, user_id)
--   values ('CA-2026-0100', 'Dra. Ana Costa', 'uuid-do-auth-users');
--
-- Revogar certificado:
--   update public.certificates set revoked_at = now() where code = 'CA-2026-0100';
--
-- Criar convite:
--   insert into public.invite_tokens (token, label, max_uses)
--   values ('MEU-CONVITE-XYZ', 'Turma março', 5);
--
-- Promover admin do painel (ou: npm run admin:create):
--   insert into public.admin_users (email) values ('voce@chatjuridico.com.br');
--
-- Promover aluno a admin (espelho auth):
--   update public.users set role = 'admin' where email = 'seu@email.com';
--
-- Conferir espelho auth → users:
--   select u.id, u.email, u.full_name, u.last_sign_in_at from public.users u;
--
-- Testar verificação:
--   select * from public.verify_certificate('CA-2026-48271');
--
-- Listar certificados ativos (SQL Editor / service role):
--   select code, recipient_name, issued_at from public.certificates where revoked_at is null;
