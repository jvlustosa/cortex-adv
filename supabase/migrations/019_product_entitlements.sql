-- Acesso por produto. Até aqui, ter conta = ter o curso inteiro. Com a venda
-- avulsa do Degravação, uma conta pode ter só um produto — o curso passa a
-- exigir o direito 'curso' (que inclui o Degravação como bônus).
--
-- ORDEM DE DEPLOY: rode esta migration ANTES de subir o código. O backfill
-- abaixo dá 'curso' a toda conta existente; sem ele o código novo trava todo
-- membro pagante. Contas criadas entre a migration e o deploy (código antigo
-- não grava direito) recebem 'curso' rodando o backfill de novo — é idempotente.

create table if not exists public.product_entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('curso', 'degravacao')),
  -- De onde veio: 'invite', 'grant-api', 'backfill-019', 'admin'.
  source text,
  created_at timestamptz not null default now(),
  primary key (user_id, product)
);

comment on table public.product_entitlements is
  'Produtos que cada conta comprou. curso inclui degravacao.';

alter table public.product_entitlements enable row level security;

-- O aluno lê os próprios direitos (gate SSR com a sessão dele). Escrita só via
-- service role (grant/signup) — sem policy de insert/update/delete.
drop policy if exists "product_entitlements_select_own_or_admin" on public.product_entitlements;
create policy "product_entitlements_select_own_or_admin"
on public.product_entitlements
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Backfill: toda conta que já existe comprou o curso.
insert into public.product_entitlements (user_id, product, source)
select u.id, 'curso', 'backfill-019'
from auth.users u
on conflict (user_id, product) do nothing;

-- Produto que o convite libera ao ser resgatado.
alter table public.invite_tokens
  add column if not exists product text not null default 'curso';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'invite_tokens_product_chk'
  ) then
    alter table public.invite_tokens
      add constraint invite_tokens_product_chk
      check (product in ('curso', 'degravacao'));
  end if;
end $$;

comment on column public.invite_tokens.product is
  'Produto liberado no resgate: curso | degravacao.';

-- has_product(): o curso cobre o degravacao. security definer para a policy
-- de lessons/modules não depender da RLS de product_entitlements.
create or replace function public.has_product(p_product text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.product_entitlements e
    where e.user_id = auth.uid()
      and (e.product = p_product or e.product = 'curso')
  );
$$;

revoke all on function public.has_product(text) from public;
grant execute on function public.has_product(text) to authenticated;

-- Aulas e módulos: antes qualquer conta lia (inclusive youtube_id/tella pela
-- anon key). Agora só quem tem o curso. Prévia gratuita continua aberta.
drop policy if exists "modules_select_published" on public.modules;
create policy "modules_select_published"
on public.modules
for select
to authenticated
using (
  public.is_admin()
  or (
    public.has_product('curso')
    and published = true
    and exists (
      select 1
      from public.courses c
      where c.id = modules.course_id
        and c.published = true
    )
  )
);

drop policy if exists "lessons_select_available" on public.lessons;
create policy "lessons_select_available"
on public.lessons
for select
to authenticated
using (
  public.is_admin()
  or is_free_preview = true
  or (
    public.has_product('curso')
    and published = true
    and exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and m.published = true
        and c.published = true
    )
  )
);

-- Progresso alimenta o certificado: só quem tem o curso grava. Prod nunca
-- recebeu a 004 (lesson_progress não existe lá), então o bloco é condicional.
do $$
begin
  if to_regclass('public.lesson_progress') is null then
    return;
  end if;

  drop policy if exists "lesson_progress_insert_own" on public.lesson_progress;
  create policy "lesson_progress_insert_own"
  on public.lesson_progress
  for insert
  to authenticated
  with check (user_id = auth.uid() and public.has_product('curso'));

  drop policy if exists "lesson_progress_update_own" on public.lesson_progress;
  create policy "lesson_progress_update_own"
  on public.lesson_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.has_product('curso'));
end $$;
