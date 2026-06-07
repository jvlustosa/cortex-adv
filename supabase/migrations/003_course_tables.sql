-- Curso, módulos (níveis) e aulas

do $$ begin
  create type public.lesson_badge as enum (
    'gratis',
    'ancora',
    'entregavel',
    'capstone'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text,
  description text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.courses is 'Catálogo de cursos da Claude Academy.';

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null,
  level_key text not null,
  level_num int,
  title text not null,
  subtitle text,
  sort_order int not null default 0,
  published boolean not null default false,
  release_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  check (
    (level_key = 'bonus' and level_num is null)
    or (level_key <> 'bonus' and level_num is not null)
  )
);

comment on table public.modules is 'Níveis do curso (ex.: Fundamentos, Prompting, Skills).';

create index if not exists modules_course_sort_idx
on public.modules (course_id, sort_order);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  slug text not null,
  title text not null,
  objective text not null,
  duration_minutes int not null default 5 check (duration_minutes > 0),
  badge public.lesson_badge,
  video_url text,
  video_provider text,
  content_md text,
  sort_order int not null default 0,
  published boolean not null default false,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

comment on table public.lessons is 'Microaulas em vídeo do curso.';

create index if not exists lessons_module_sort_idx
on public.lessons (module_id, sort_order);

create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create trigger modules_set_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();
