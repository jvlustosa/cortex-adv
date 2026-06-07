-- Seed: curso Claude para Advogados
-- Gerado por: node scripts/generate-course-seed.mjs

insert into public.courses (slug, title, tagline, description, published, sort_order)
values ('claude-para-advogados', 'Claude para Advogados', 'Claude para a advocacia brasileira — com skills, padrões de peça e disciplina ética.', 'Claude para a advocacia brasileira — com skills, padrões de peça e disciplina ética.', true, 0)
on conflict (slug) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  updated_at = now();

-- Módulo n0
insert into public.modules (course_id, slug, level_key, level_num, title, subtitle, sort_order, published)
select c.id,
  'n0',
  '0',
  0,
  'Fundamentos e Segurança',
  'Aulas 0.1 e 0.2 liberadas como amostra grátis',
  0,
  true
from public.courses c
where c.slug = 'claude-para-advogados'
on conflict (course_id, slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '0.1',
  'Boas-vindas',
  'Mapa do curso, caso-fio-condutor e biblioteca de prompts',
  3,
  'gratis'::public.lesson_badge,
  0,
  true,
  true
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n0'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '0.2',
  'O que o Claude é e o que ele não é',
  'Modelo de linguagem; por que ele "inventa" com confiança',
  5,
  'gratis'::public.lesson_badge,
  1,
  true,
  true
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n0'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '0.3',
  'Acesso, planos e interface',
  'A interface em cinco minutos',
  5,
  null,
  2,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n0'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '0.4',
  'Sigilo, LGPD e ética OAB',
  'O que pode entrar numa conversa, dados de cliente, dever de revisão',
  5,
  'ancora'::public.lesson_badge,
  3,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n0'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '0.5',
  'A regra de ouro',
  'Você assina, você responde',
  4,
  null,
  4,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n0'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Módulo n1
insert into public.modules (course_id, slug, level_key, level_num, title, subtitle, sort_order, published)
select c.id,
  'n1',
  '1',
  1,
  'Prompting Jurídico',
  'O coração do curso — ≈ 80% do valor',
  1,
  false
from public.courses c
where c.slug = 'claude-para-advogados'
on conflict (course_id, slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '1.1',
  'Anatomia de um prompt que funciona',
  'Papel + contexto + tarefa + formato + restrição',
  5,
  null,
  0,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n1'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '1.2',
  'Seu primeiro pedido de peça',
  'O briefing que muda o resultado',
  5,
  null,
  1,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n1'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '1.3',
  'Pedindo do jeito certo',
  'Parecer, análise e resumo',
  5,
  null,
  2,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n1'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '1.4',
  'Iterar e refinar',
  'Por que a 1ª resposta nunca é a final',
  5,
  null,
  3,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n1'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '1.5',
  'Domando a alucinação',
  'Exigir fonte, mandar verificar, "não invente"',
  5,
  null,
  4,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n1'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '1.6',
  'Ensinando seu estilo ao Claude',
  'Tom, formatação, padrões de redação',
  4,
  null,
  5,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n1'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '1.7',
  'Os 10 prompts da semana',
  'Biblioteca inicial de prompts',
  5,
  'entregavel'::public.lesson_badge,
  6,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n1'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Módulo n2
insert into public.modules (course_id, slug, level_key, level_num, title, subtitle, sort_order, published)
select c.id,
  'n2',
  '2',
  2,
  'Trabalho com Documentos',
  null,
  2,
  false
from public.courses c
where c.slug = 'claude-para-advogados'
on conflict (course_id, slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '2.1',
  'Subindo documentos',
  'PDFs de processo, contratos, decisões',
  4,
  null,
  0,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n2'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '2.2',
  'Lendo e resumindo autos extensos',
  'Sem perder o ponto',
  5,
  null,
  1,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n2'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '2.3',
  'Análise de contrato profissional',
  'Cláusula integral → risco → sugestão substitutiva',
  5,
  null,
  2,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n2'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '2.4',
  'Gerando arquivos prontos',
  'Word, Excel e PDF',
  5,
  null,
  3,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n2'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '2.5',
  'Artifacts',
  'Peças, planilhas e calculadoras na conversa',
  5,
  null,
  4,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n2'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '2.6',
  'Caso prático completo',
  'Do PDF bruto à minuta revisável',
  5,
  null,
  5,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n2'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Módulo n3
insert into public.modules (course_id, slug, level_key, level_num, title, subtitle, sort_order, published)
select c.id,
  'n3',
  '3',
  3,
  'Projects e Memória',
  null,
  3,
  false
from public.courses c
where c.slug = 'claude-para-advogados'
on conflict (course_id, slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '3.1',
  'O que é um Project',
  'E por que ele muda tudo',
  4,
  null,
  0,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n3'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '3.2',
  'Montando o Project do escritório',
  'Conhecimento + instruções',
  5,
  null,
  1,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n3'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '3.3',
  'Instruções que codificam seu jeito',
  'Padrões de trabalho automatizados',
  5,
  null,
  2,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n3'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '3.4',
  'Project por caso/cliente',
  'Organização e continuidade',
  5,
  null,
  3,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n3'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '3.5',
  'Memória e histórico',
  'O Claude que lembra do que importa',
  4,
  null,
  4,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n3'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Módulo n4
insert into public.modules (course_id, slug, level_key, level_num, title, subtitle, sort_order, published)
select c.id,
  'n4',
  '4',
  4,
  'Pesquisa e Jurisprudência',
  'Com freio de mão',
  4,
  false
from public.courses c
where c.slug = 'claude-para-advogados'
on conflict (course_id, slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '4.1',
  'Pesquisa na web com Claude',
  'Quando vale e quando não',
  4,
  null,
  0,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n4'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '4.2',
  'Jurisprudência assistida',
  'O aviso que protege sua OAB: validar sempre na fonte oficial',
  5,
  null,
  1,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n4'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '4.3',
  'Monitorando temas que você acompanha',
  'Ex.: teses tributárias',
  4,
  null,
  2,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n4'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '4.4',
  'Os limites',
  'O que nunca terceirizar à IA',
  4,
  null,
  3,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n4'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Módulo n5
insert into public.modules (course_id, slug, level_key, level_num, title, subtitle, sort_order, published)
select c.id,
  'n5',
  '5',
  5,
  'Skills',
  'O teto e o diferencial do curso',
  5,
  false
from public.courses c
where c.slug = 'claude-para-advogados'
on conflict (course_id, slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '5.1',
  'O que é uma Skill',
  'E por que ela industrializa seu escritório',
  5,
  null,
  0,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n5'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '5.2',
  'Anatomia de uma skill',
  'Quando o Claude a aciona e o que ela carrega',
  5,
  null,
  1,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n5'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '5.3',
  'Criando sua primeira skill',
  'Modelo de petição padronizado',
  5,
  null,
  2,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n5'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '5.4',
  'Skill de análise de contrato',
  'No seu formato fixo',
  5,
  null,
  3,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n5'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '5.5',
  'Mantendo sua biblioteca de skills',
  'Organização e versionamento',
  4,
  null,
  4,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n5'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  '5.6',
  'Capstone',
  'Monte seu kit de produção: Project + 3 skills + biblioteca',
  5,
  'capstone'::public.lesson_badge,
  5,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'n5'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Módulo bonus
insert into public.modules (course_id, slug, level_key, level_num, title, subtitle, sort_order, published)
select c.id,
  'bonus',
  'bonus',
  null,
  'Bônus — O que vem depois',
  null,
  6,
  false
from public.courses c
where c.slug = 'claude-para-advogados'
on conflict (course_id, slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)
select m.id,
  'B.1',
  'Conectores, automação e o escritório que roda sozinho',
  'Gancho para um curso avançado',
  4,
  null,
  0,
  false,
  false
from public.modules m
join public.courses c on c.id = m.course_id
where c.slug = 'claude-para-advogados' and m.slug = 'bonus'
on conflict (module_id, slug) do update set
  title = excluded.title,
  objective = excluded.objective,
  duration_minutes = excluded.duration_minutes,
  badge = excluded.badge,
  sort_order = excluded.sort_order,
  updated_at = now();

