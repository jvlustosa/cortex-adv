-- GERADO por scripts/course-video-seed.mjs — fonte: src/data/course.yml
-- Preenche o vídeo de todas as aulas em lesson_overrides (Supabase = fonte da verdade).
-- Requer a coluna tella (migration 012_lesson_tella.sql). Re-executável: só toca
-- tella/youtube_id + updated_at, preservando published/title/duration/description.

insert into public.lesson_overrides (module_id, lesson_id, tella, youtube_id, updated_at)
values
  ('comece-aqui', 'o-que-e-claude', '01-ca-1-o-que-e-o-claude-f528', null, now()),
  ('comece-aqui', 'o-que-e-anthropic', '02-ca-2-o-que-e-a-anthropic-d1o3', null, now()),
  ('comece-aqui', 'claude-vs-chatgpt', '03-ca-3-claude-vs-chatgpt-ahkq', null, now()),
  ('comece-aqui', 'nivel-de-dificuldade', '04-ca-4-nivel-de-dificuldade-para-adaptacao-224s', null, now()),
  ('comece-aqui', 'qual-plano-escolher', '05-ca-5-qual-plano-escolher-04qx', null, now()),
  ('fundacao-pratica', 'o-que-vai-aprender', '10-intro-o-que-voce-vai-aprender-no-modulo-1-1-5ut1', null, now()),
  ('fundacao-pratica', '5-superpoderes', '11-os-5-superpoderes-do-claude-que-mais-ajudam-advogados-1-5crm', null, now()),
  ('fundacao-pratica', 'escritorio-seguro-ia', '12-seu-escritorio-esta-seguro-para-usar-ia-4uuo', null, now()),
  ('fundacao-pratica', 'o-que-e-contexto', '13-o-que-e-contexto-326q', null, now()),
  ('fundacao-pratica', 'ambientes-claude', '14-chat-projects-chrome-e-cowork-quando-usar-cada-ambiente-dggd', null, now())
on conflict (module_id, lesson_id) do update set
  tella = excluded.tella,
  youtube_id = excluded.youtube_id,
  updated_at = now();
