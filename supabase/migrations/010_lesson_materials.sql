-- Materiais por aula (skills, PDFs, templates) para download na área de membros.
-- Arquivos no bucket privado 'lesson-materials'; metadados nesta tabela.
-- Leitura/escrita via service role nas API routes (mesmo padrão de lesson_overrides).

create table if not exists public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  lesson_id text not null,
  label text not null,                 -- nome exibido (ex.: "Skill: petição inicial")
  file_path text not null,             -- caminho no bucket (ex.: cowork/cowork-1/skill.md)
  file_name text not null,             -- nome usado no download
  content_type text,
  size_bytes bigint,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lesson_materials_lesson_idx
  on public.lesson_materials (module_id, lesson_id, sort_order);

alter table public.lesson_materials enable row level security;
-- Sem policy pública: só o service role (API routes) lê/grava. Downloads são
-- servidos via signed URL gerada no servidor para alunos autenticados.

-- Bucket privado para os arquivos (idempotente).
insert into storage.buckets (id, name, public)
values ('lesson-materials', 'lesson-materials', false)
on conflict (id) do nothing;

-- Exemplo de cadastro de material (após subir o arquivo no bucket):
--   insert into public.lesson_materials (module_id, lesson_id, label, file_path, file_name, content_type)
--   values ('cowork', 'cowork-1', 'Skill: boas-vindas', 'cowork/cowork-1/skill.md', 'skill-boas-vindas.md', 'text/markdown');
