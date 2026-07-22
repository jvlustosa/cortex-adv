-- Módulos "em breve" da trilha pública (curso-trilha-public.ts) → tabela modules.
-- Substitui a lista hardcoded na área de membros quando COURSE_SOURCE=db.
--
-- Idempotente: upsert por (course_id, slug). Só insere o que ainda não existe;
-- em conflito atualiza título/descrição/capa/ordem, mas NÃO sobrescreve
-- coming_soon (o admin controla ativar/desativar no /admin).
--
-- Requer: 014_course_native_runtime.sql, 015_module_coming_soon.sql
-- Curso alvo: claude-cowork-advogados (npm run db:seed -- --apply)
--
-- Para publicar: desmarque "Em breve" no painel e adicione as aulas.

insert into public.modules (
  course_id,
  slug,
  level_key,
  level_num,
  title,
  description,
  thumbnail_gradient,
  cover_image,
  unlock_after_days,
  sort_order,
  published,
  coming_soon
)
select
  c.id,
  v.slug,
  v.level_key,
  v.level_num,
  v.title,
  v.description,
  v.thumbnail_gradient,
  v.cover_image,
  0,
  v.sort_order,
  true,
  true
from public.courses c
cross join (
  values
    (
      'economia-claude',
      '2',
      2,
      'Economia do Claude',
      'Tokens em linguagem de advogado, input vs output e o ROI do seu tempo',
      'linear-gradient(145deg, #0a0a0a 0%, #1a1410 45%, #92400e 100%)',
      '/assets/images/temporadas/temporada-2-economia-claude.png',
      4
    ),
    (
      'projects',
      '3',
      3,
      'Projects',
      'Montando o Project "Meu Escritório" e Projects por área de atuação',
      'linear-gradient(145deg, #0a0a0a 0%, #141820 45%, #2563eb 100%)',
      '/assets/images/temporadas/temporada-3-projects.png',
      5
    ),
    (
      'cowork',
      '4',
      4,
      'Cowork',
      '4 demos ao vivo: organizar pasta caótica, extrair dados pra planilha, minuta recorrente e briefing semanal automático',
      'linear-gradient(145deg, #0a0a0a 0%, #1f1410 45%, #d97757 100%)',
      '/assets/images/temporadas/temporada-4-cowork.png',
      6
    ),
    (
      'escritorio-automatico',
      '5',
      5,
      'Escritório no automático',
      'Os 5 fluxos que todo escritório deveria automatizar e Chat Jurídico + Claude integrados na prática',
      'linear-gradient(145deg, #0a0a0a 0%, #101820 45%, #0d9488 100%)',
      '/assets/images/temporadas/temporada-5-escritorio-automatico.png',
      7
    ),
    (
      'artefatos',
      '6',
      6,
      'Artefatos',
      'Calculadora trabalhista do zero, Live Artifacts com IA por dentro e triagem inicial de cliente',
      'linear-gradient(145deg, #0a0a0a 0%, #1a1020 45%, #7c3aed 100%)',
      '/assets/images/temporadas/temporada-6-artefatos.png',
      8
    ),
    (
      'encerramento',
      '7',
      7,
      'Encerramento',
      'Plano de ação de 30 dias, certificado e próximos passos',
      'linear-gradient(145deg, #0a0a0a 0%, #1a0f0a 40%, #78716c 100%)',
      '/assets/images/temporadas/temporada-7-encerramento.png',
      9
    )
) as v(
  slug,
  level_key,
  level_num,
  title,
  description,
  thumbnail_gradient,
  cover_image,
  sort_order
)
where c.slug = 'claude-cowork-advogados'
on conflict (course_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  thumbnail_gradient = excluded.thumbnail_gradient,
  cover_image = excluded.cover_image,
  level_key = excluded.level_key,
  level_num = excluded.level_num,
  sort_order = excluded.sort_order,
  updated_at = now();
  -- coming_soon e published preservados no conflito: admin decide quando ativar.

-- Módulos da trilha sem aulas ainda → garante coming_soon (só se vazio).
update public.modules m
set coming_soon = true,
    updated_at = now()
from public.courses c
where m.course_id = c.id
  and c.slug = 'claude-cowork-advogados'
  and m.slug in (
    'economia-claude',
    'projects',
    'cowork',
    'escritorio-automatico',
    'artefatos',
    'encerramento'
  )
  and not exists (select 1 from public.lessons l where l.module_id = m.id);

comment on table public.modules is
  'Níveis do curso. coming_soon=true → card "Será em breve" nos membros (gerido no /admin).';
