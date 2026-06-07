-- Aulas: overrides editáveis, views e feedback dos alunos

create table if not exists public.lesson_overrides (
  module_id text not null,
  lesson_id text not null,
  youtube_id text,
  duration text,
  title text,
  description text,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (module_id, lesson_id)
);

create table if not exists public.lesson_views (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  lesson_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index if not exists lesson_views_lesson_idx
  on public.lesson_views (module_id, lesson_id);

create index if not exists lesson_views_viewed_at_idx
  on public.lesson_views (viewed_at desc);

create table if not exists public.lesson_feedback (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  lesson_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (user_id, module_id, lesson_id)
);

create index if not exists lesson_feedback_lesson_idx
  on public.lesson_feedback (module_id, lesson_id);

create index if not exists lesson_feedback_created_at_idx
  on public.lesson_feedback (created_at desc);

alter table public.lesson_overrides enable row level security;
alter table public.lesson_views enable row level security;
alter table public.lesson_feedback enable row level security;

-- Sem policies públicas: leitura/escrita via service role nas API routes.
