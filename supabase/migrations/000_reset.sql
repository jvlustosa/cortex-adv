-- RESET Claude Academy — apaga schema public do app (NÃO apaga auth.users)
-- Rode ANTES de recriar tudo do zero.

drop view if exists public.v_my_lesson_progress cascade;
drop view if exists public.v_course_outline cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

drop table if exists public.lesson_progress cascade;
drop table if exists public.lesson_feedback cascade;
drop table if exists public.lesson_views cascade;
drop table if exists public.lesson_overrides cascade;
drop table if exists public.lessons cascade;
drop table if exists public.modules cascade;
drop table if exists public.courses cascade;
drop table if exists public.certificates cascade;
drop table if exists public.invite_tokens cascade;
drop table if exists public.admin_users cascade;
drop table if exists public.users cascade;
drop table if exists public.profiles cascade;

drop function if exists public.sync_user_from_auth() cascade;
drop function if exists public.sync_profile_from_auth_user() cascade;
drop function if exists public.sync_lesson_progress_completed_at() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.verify_certificate(text) cascade;
drop function if exists public.consume_invite_token(text) cascade;

drop type if exists public.lesson_badge cascade;
drop type if exists public.academy_role cascade;
