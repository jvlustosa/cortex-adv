-- Progresso do aluno por aula

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed boolean not null default false,
  progress_pct smallint not null default 0 check (progress_pct between 0 and 100),
  last_position_seconds int not null default 0 check (last_position_seconds >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

comment on table public.lesson_progress is 'Progresso de visualização/conclusão por aluno e aula.';

create index if not exists lesson_progress_user_idx
on public.lesson_progress (user_id);

create index if not exists lesson_progress_lesson_idx
on public.lesson_progress (lesson_id);

create trigger lesson_progress_set_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();

-- Marca completed_at automaticamente
create or replace function public.sync_lesson_progress_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.completed and new.completed_at is null then
    new.completed_at = now();
    new.progress_pct = 100;
  elsif not new.completed then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger lesson_progress_sync_completed
before insert or update on public.lesson_progress
for each row execute function public.sync_lesson_progress_completed_at();
