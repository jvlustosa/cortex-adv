-- Alinha as tabelas nativas (courses/modules/lessons) ao shape que o runtime
-- usa hoje via course.yml → COURSE. Depois desta migração + seed, o DB passa a
-- ser a fonte da verdade do conteúdo do curso (ver PRD course-db-native).
-- Aplicar à mão no SQL editor do Supabase (não há runner automático).

-- courses: subtitle p/ fidelidade ao shape { title, subtitle } do runtime
alter table public.courses add column if not exists subtitle text;

-- modules: colunas de apresentação que o runtime usa (CourseModule)
alter table public.modules add column if not exists description text;
alter table public.modules add column if not exists thumbnail_gradient text;
alter table public.modules add column if not exists cover_image text;
alter table public.modules add column if not exists unlock_after_days int not null default 0;

-- Seções criadas no painel não têm level_key/level_num → relaxar exigência.
alter table public.modules alter column level_key drop not null;

-- Remove o check inline de 003 que exige level_num quando level_key<>'bonus'.
-- O nome auto-gerado do único check inline da tabela é `modules_check`.
alter table public.modules drop constraint if exists modules_check;

-- lessons: vídeo no shape do player (youtube_id + tella, Tella tem prioridade)
-- + duração de exibição (string) e descrição.
alter table public.lessons add column if not exists youtube_id text;
alter table public.lessons add column if not exists tella text;
alter table public.lessons add column if not exists duration text;
alter table public.lessons add column if not exists description text;

-- Aulas criadas no painel não preenchem objective/duration_minutes → relaxar.
alter table public.lessons alter column objective drop not null;
alter table public.lessons alter column duration_minutes drop not null;

-- Nota: video_url/video_provider/objective/duration_minutes/badge/content_md
-- ficam sem uso pelo runtime, mas não são removidos aqui (evita quebrar
-- migrations/seed antigos). Podem ser depreciados numa limpeza futura.
