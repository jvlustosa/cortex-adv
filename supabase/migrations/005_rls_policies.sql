-- RLS: catálogo (leitura) e progresso (escrita do próprio aluno)

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

-- ── COURSES ────────────────────────────────────────────────────────────────

create policy "courses_select_published"
on public.courses
for select
to authenticated
using (published = true or public.is_admin());

create policy "courses_admin_write"
on public.courses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ── MODULES ────────────────────────────────────────────────────────────────

create policy "modules_select_published"
on public.modules
for select
to authenticated
using (
  public.is_admin()
  or (
    published = true
    and exists (
      select 1
      from public.courses c
      where c.id = modules.course_id
        and c.published = true
    )
  )
);

create policy "modules_admin_write"
on public.modules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ── LESSONS ────────────────────────────────────────────────────────────────

create policy "lessons_select_available"
on public.lessons
for select
to authenticated
using (
  public.is_admin()
  or is_free_preview = true
  or (
    published = true
    and exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and m.published = true
        and c.published = true
    )
  )
);

create policy "lessons_admin_write"
on public.lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ── LESSON PROGRESS ────────────────────────────────────────────────────────

create policy "lesson_progress_select_own"
on public.lesson_progress
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "lesson_progress_insert_own"
on public.lesson_progress
for insert
to authenticated
with check (user_id = auth.uid());

create policy "lesson_progress_update_own"
on public.lesson_progress
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "lesson_progress_delete_own"
on public.lesson_progress
for delete
to authenticated
using (user_id = auth.uid());

create policy "lesson_progress_admin_all"
on public.lesson_progress
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
