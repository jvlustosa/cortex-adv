-- =============================================================================
-- Claude Academy · Setup completo Supabase
-- Projeto: chat-juridico-claude-academy (claudeacademy.chatjuridico.com.br)
--
-- COMO USAR
-- 1. Crie um projeto em https://supabase.com (região sa-east-1 recomendada)
-- 2. Authentication → Providers → Email: habilitado
-- 3. Authentication → Settings:
--      • Enable email signups: DESLIGADO (cadastro só via API + convite)
--      • Confirm email: opcional (API usa email_confirm: true no admin.createUser)
-- 4. Authentication → URL Configuration:
--      Site URL:     https://claudeacademy.chatjuridico.com.br
--      Redirect URLs (login OAuth + recuperação de senha):
--        https://claudeacademy.chatjuridico.com.br/auth/callback
--        https://claudeacademy.chatjuridico.com.br/auth/atualizar-senha
--        http://localhost:3000/auth/callback
--        http://localhost:3000/auth/atualizar-senha
-- 4b. Authentication → Email Templates → Reset password: manter padrão Supabase
-- 5. Cole e execute ESTE arquivo no SQL Editor (Run)
-- 6. Settings → API: copie URL, anon key e service_role para a Vercel / .env.local
--
-- Variáveis de ambiente (app Next.js):
--   NEXT_PUBLIC_SUPABASE_URL=
--   NEXT_PUBLIC_SUPABASE_ANON_KEY=
--   SUPABASE_SERVICE_ROLE_KEY=
--   NEXT_PUBLIC_SITE_URL=https://claudeacademy.chatjuridico.com.br
--   NEXT_PUBLIC_SUPABASE_ENABLED=true          (dev local)
--   NEXT_PUBLIC_SIGNUP_ENABLED=true            (opcional, abre /signup em prod)
-- =============================================================================

-- ─── Extensões ───────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

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
-- Apenas service role (postgres/supabase_admin) executa via admin client.

comment on function public.consume_invite_token(text) is
  'Incrementa used_count de forma atômica. Chamada pela API /api/auth/signup com service role.';

-- ─── Aulas: overrides, views, feedback (003_course_admin.sql) ───────────────

create table if not exists public.lesson_overrides (
  module_id text not null,
  lesson_id text not null,
  youtube_id text,
  duration text,
  title text,
  description text,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (module_id, lesson_id)
);

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
  'E-mails autorizados no painel /admin. Requer domínio @chatjuridico.com.br no login.';

-- ─── Seeds de desenvolvimento / demo ────────────────────────────────────────

insert into public.invite_tokens (token, label, max_uses, expires_at)
values
  ('CONVITE-DEMO-2026', 'Demo local · uso único', 10, '2027-12-31 23:59:59+00'),
  ('TURMA-01-VIP', 'Primeira turma · VIP', 1, null)
on conflict (token) do nothing;

insert into public.certificates (code, recipient_name, issued_at)
values
  ('CA-2026-0042', 'Dra. Maria Silva', '2026-06-01'),
  ('CA-2026-0001', 'Dr. João Souza', current_date)
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
-- Promover admin do painel (e-mail @chatjuridico.com.br):
--   insert into public.admin_users (email) values ('voce@chatjuridico.com.br');
--
-- Testar verificação:
--   select * from public.verify_certificate('CA-2026-0042');
--
-- Listar certificados ativos (SQL Editor / service role):
--   select code, recipient_name, issued_at from public.certificates where revoked_at is null;
