-- =============================================================================
-- Claude Academy · Inspeção de estrutura do banco (schema public)
-- Uso: SQL Editor do Supabase. O editor mostra o resultado do ÚLTIMO statement,
-- então rode UMA seção por vez (selecione o bloco e Run) — ou use a Seção 0,
-- que devolve tudo em UMA linha por tabela (JSON), num único result set.
-- Read-only: nenhum statement escreve nada.
-- =============================================================================


-- ─── Seção 0 · Visão completa em um único result set ─────────────────────────
-- Uma linha por tabela: colunas (tipo/nullable/default), se tem RLS, e quantas
-- policies. Ideal pra bater o olho e achar drift (coluna faltando etc.).

select
  t.table_name,
  c.rls_enabled,
  c.n_policies,
  cols.columns
from (
  select table_name
  from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
) t
left join lateral (
  select
    pc.relrowsecurity as rls_enabled,
    (select count(*) from pg_policy p where p.polrelid = pc.oid) as n_policies
  from pg_class pc
  join pg_namespace n on n.oid = pc.relnamespace
  where n.nspname = 'public' and pc.relname = t.table_name
) c on true
left join lateral (
  select json_agg(
    json_build_object(
      'col', col.column_name,
      'type', col.data_type,
      'nullable', col.is_nullable,
      'default', col.column_default
    ) order by col.ordinal_position
  ) as columns
  from information_schema.columns col
  where col.table_schema = 'public' and col.table_name = t.table_name
) cols on true
order by t.table_name;


-- ─── Seção 1 · Tabelas + contagem de linhas ──────────────────────────────────

select
  n.nspname            as schema,
  c.relname            as table_name,
  c.reltuples::bigint  as approx_rows,
  c.relrowsecurity     as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;


-- ─── Seção 2 · Colunas (flat) — a mais útil pra caçar drift ───────────────────

select
  table_name,
  ordinal_position as pos,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;


-- ─── Seção 3 · Constraints (PK, FK, UNIQUE, CHECK) ───────────────────────────

select
  con.conrelid::regclass                    as table_name,
  con.conname                               as constraint_name,
  case con.contype
    when 'p' then 'PRIMARY KEY'
    when 'f' then 'FOREIGN KEY'
    when 'u' then 'UNIQUE'
    when 'c' then 'CHECK'
    else con.contype::text
  end                                       as type,
  pg_get_constraintdef(con.oid)             as definition
from pg_constraint con
join pg_namespace n on n.oid = con.connamespace
where n.nspname = 'public'
order by table_name, type;


-- ─── Seção 4 · Índices ────────────────────────────────────────────────────────

select
  tablename  as table_name,
  indexname  as index_name,
  indexdef   as definition
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;


-- ─── Seção 5 · Policies RLS ───────────────────────────────────────────────────

select
  schemaname,
  tablename,
  policyname,
  cmd        as command,
  roles,
  qual       as using_expr,
  with_check as with_check_expr
from pg_policies
where schemaname = 'public'
order by tablename, policyname;


-- ─── Seção 6 · Funções e RPCs ─────────────────────────────────────────────────

select
  p.proname                          as function_name,
  pg_get_function_arguments(p.oid)   as args,
  pg_get_function_result(p.oid)      as returns,
  p.prosecdef                        as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;


-- ─── Seção 7 · Views ──────────────────────────────────────────────────────────

select table_name as view_name
from information_schema.views
where table_schema = 'public'
order by table_name;


-- ─── Seção 8 · Triggers ───────────────────────────────────────────────────────

select
  c.relname   as table_name,
  t.tgname    as trigger_name,
  pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal
order by c.relname, t.tgname;
