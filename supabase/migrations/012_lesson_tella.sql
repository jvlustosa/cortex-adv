-- Vídeo gerido no Supabase: fonte Tella por aula, no mesmo overlay de lesson_overrides.
-- Mantém a regra do app: `tella` tem prioridade sobre `youtube_id`; sem nenhum dos
-- dois a aula cai no placeholder "vídeo em produção".
-- Depois de aplicar, rode supabase/seed-lesson-videos.sql para preencher todas as aulas.

alter table public.lesson_overrides
  add column if not exists tella text;
