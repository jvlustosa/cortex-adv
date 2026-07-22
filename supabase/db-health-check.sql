-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Claude Academy — checagem de saúde do banco (curso DB-native + materiais)  │
-- │                                                                            │
-- │ Cole no SQL Editor do Supabase (projeto de prod) e rode. Read-only.        │
-- │ UMA query: cada linha é um item. Olhe a coluna STATUS — tudo ✅ = banco    │
-- │ 100% pronto pro painel /admin em modo COURSE_SOURCE=db. Qualquer ❌ FALTA  │
-- │ ordena no topo com a migração que resolve.                                 │
-- │                                                                            │
-- │ Cobre migrações 010, 012, 013, 014, 015 + seed + bucket de materiais +     │
-- │ drift catálogo↔DB. Sem efeitos colaterais.                                 │
-- └──────────────────────────────────────────────────────────────────────────┘

with col as (
  select table_name, column_name, is_nullable
  from information_schema.columns
  where table_schema = 'public'
),
checks as (
  -- ── colunas exigidas pelo runtime DB-native (014) ────────────────────────
  select '014' as mig, 'coluna courses.subtitle'            as item, exists(select 1 from col where table_name='courses' and column_name='subtitle')           as ok, ''::text as detalhe union all
  select '014', 'coluna modules.description',        exists(select 1 from col where table_name='modules' and column_name='description'),        '' union all
  select '014', 'coluna modules.thumbnail_gradient', exists(select 1 from col where table_name='modules' and column_name='thumbnail_gradient'), '' union all
  select '014', 'coluna modules.cover_image',        exists(select 1 from col where table_name='modules' and column_name='cover_image'),        '' union all
  select '014', 'coluna modules.unlock_after_days',  exists(select 1 from col where table_name='modules' and column_name='unlock_after_days'),  '' union all
  select '015', 'coluna modules.coming_soon',        exists(select 1 from col where table_name='modules' and column_name='coming_soon'),        '' union all
  select '014', 'coluna lessons.youtube_id',         exists(select 1 from col where table_name='lessons' and column_name='youtube_id'),         '' union all
  select '014', 'coluna lessons.tella',              exists(select 1 from col where table_name='lessons' and column_name='tella'),              '' union all
  select '014', 'coluna lessons.duration',           exists(select 1 from col where table_name='lessons' and column_name='duration'),           '' union all
  select '014', 'coluna lessons.description',        exists(select 1 from col where table_name='lessons' and column_name='description'),        '' union all
  select '012', 'coluna lesson_overrides.tella',       exists(select 1 from col where table_name='lesson_overrides' and column_name='tella'),       '' union all
  select '013', 'coluna lesson_overrides.order_index', exists(select 1 from col where table_name='lesson_overrides' and column_name='order_index'), '' union all

  -- ── relaxações de NOT NULL que o seed/painel dependem (014) ───────────────
  select '014', 'modules.level_key aceita NULL',       coalesce((select is_nullable='YES' from col where table_name='modules' and column_name='level_key'), false),        '' union all
  select '014', 'lessons.objective aceita NULL',       coalesce((select is_nullable='YES' from col where table_name='lessons' and column_name='objective'), false),        '' union all
  select '014', 'lessons.duration_minutes aceita NULL',coalesce((select is_nullable='YES' from col where table_name='lessons' and column_name='duration_minutes'), false), '' union all

  -- ── tabelas ──────────────────────────────────────────────────────────────
  select '003', 'tabela courses', to_regclass('public.courses') is not null, '' union all
  select '003', 'tabela modules', to_regclass('public.modules') is not null, '' union all
  select '003', 'tabela lessons', to_regclass('public.lessons') is not null, '' union all
  select '010', 'tabela lesson_materials', to_regclass('public.lesson_materials') is not null, '' union all

  -- ── bucket privado de materiais (010) ────────────────────────────────────
  select '010', 'bucket lesson-materials (privado)',
         exists(select 1 from storage.buckets where id='lesson-materials' and public=false),
         coalesce((select case when public then 'PÚBLICO (deveria ser privado)' else 'ok' end
                   from storage.buckets where id='lesson-materials'), 'ausente') union all

  -- ── seed presente ────────────────────────────────────────────────────────
  select 'seed', 'curso semeado (>=1)',  (select count(*) from public.courses) >= 1, (select count(*)::text from public.courses) union all
  select 'seed', 'módulos semeados (>=1)',(select count(*) from public.modules) >= 1, (select count(*)::text from public.modules) union all
  select 'seed', 'aulas semeadas (>=1)',  (select count(*) from public.lessons) >= 1, (select count(*)::text from public.lessons) union all

  -- ── capa dos módulos (cover_image explícita, não só fallback por posição) ──
  -- ❌ aqui não quebra o aluno (há fallback), mas indica módulo sem capa no DB.
  -- Popule com supabase/seed-module-covers.sql ou pelo seletor de capa no admin.
  select 'capa', 'todos os módulos com capa (cover_image)',
         not exists(select 1 from public.modules where cover_image is null or cover_image = ''),
         (select count(*)::text from public.modules where cover_image is null or cover_image = '') || ' sem capa' union all

  -- ── drift catálogo estático ↔ DB ─────────────────────────────────────────
  -- aulas no overlay estático (lesson_overrides) sem par nas tabelas nativas.
  -- 0 = seed em dia. >0 = rode `npm run db:seed -- --apply` antes do modo DB.
  select 'seed', 'sem drift catálogo↔DB',
         (select count(*) from public.lesson_overrides o
            left join public.modules m on m.slug = o.module_id
            left join public.lessons  l on l.module_id = m.id and l.slug = o.lesson_id
          where l.id is null) = 0,
         (select count(*)::text from public.lesson_overrides o
            left join public.modules m on m.slug = o.module_id
            left join public.lessons  l on l.module_id = m.id and l.slug = o.lesson_id
          where l.id is null) || ' órfãs'
)
select
  case when ok then '✅ OK' else '❌ FALTA' end as status,
  mig  as migracao,
  item,
  detalhe
from checks
order by ok asc, mig, item;   -- FALTA no topo
