-- Views de leitura com RLS herdado (security_invoker)

create or replace view public.v_course_outline
with (security_invoker = true)
as
select
  c.id as course_id,
  c.slug as course_slug,
  c.title as course_title,
  c.published as course_published,
  m.id as module_id,
  m.slug as module_slug,
  m.level_key,
  m.level_num,
  m.title as module_title,
  m.subtitle as module_subtitle,
  m.sort_order as module_sort,
  m.published as module_published,
  l.id as lesson_id,
  l.slug as lesson_slug,
  l.title as lesson_title,
  l.objective as lesson_objective,
  l.duration_minutes,
  l.badge,
  l.video_url,
  l.video_provider,
  l.sort_order as lesson_sort,
  l.published as lesson_published,
  l.is_free_preview
from public.lessons l
join public.modules m on m.id = l.module_id
join public.courses c on c.id = m.course_id
order by c.sort_order, m.sort_order, l.sort_order;

comment on view public.v_course_outline is 'Catálogo flat curso → módulo → aula (respeita RLS).';

create or replace view public.v_my_lesson_progress
with (security_invoker = true)
as
select
  lp.user_id,
  lp.lesson_id,
  lp.completed,
  lp.progress_pct,
  lp.last_position_seconds,
  lp.completed_at,
  lp.updated_at,
  o.course_slug,
  o.module_slug,
  o.lesson_slug,
  o.lesson_title,
  o.module_title
from public.lesson_progress lp
join public.v_course_outline o on o.lesson_id = lp.lesson_id
where lp.user_id = auth.uid();

comment on view public.v_my_lesson_progress is 'Progresso do usuário autenticado com metadados da aula.';
