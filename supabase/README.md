# Supabase — Claude Academy

Projeto dedicado à área de membros e catálogo de aulas.

## Estrutura

```
migrations/
  001_invite_tokens.sql   # Convites de cadastro (já existia)
  002_profiles.sql        # Perfis student/admin + trigger auth
  003_course_tables.sql   # courses, modules, lessons
  004_lesson_progress.sql # Progresso por aluno
  005_rls_policies.sql    # Row Level Security
  006_seed_curso.sql      # Roteiro completo (34 aulas)
  007_views.sql           # Views de leitura
```

## Modelo (básico)

```
auth.users
    └── profiles (role: student | admin)

courses
    └── modules (níveis 0–5 + bonus)
            └── lessons (microaulas + video_url)

lesson_progress (user_id + lesson_id)
```

## Setup no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (ex.: `claude-academy`).

2. **SQL Editor** → execute as migrations **na ordem** (`001` … `007`).

3. **Authentication → Providers → Email** → habilitado.

4. Copie credenciais para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

5. Crie um convite de teste:

```sql
insert into public.invite_tokens (token, label, max_uses)
values ('turma-dev-001', 'Dev local', 50);
```

6. Promova seu usuário a admin (após primeiro cadastro):

```sql
update public.profiles
set role = 'admin'
where email = 'seu@email.com';
```

## Regenerar seed do roteiro

Quando `src/data/curso-roteiro.ts` mudar, atualize também `scripts/curso-roteiro-data.mjs` e rode:

```bash
npm run db:seed
```

Depois reaplique `006_seed_curso.sql` no SQL Editor (idempotente via `on conflict`).

## Regras de publicação

| Recurso | Aluno vê quando |
|---------|-----------------|
| Curso | `courses.published = true` |
| Módulo | módulo + curso publicados |
| Aula | publicada **ou** `is_free_preview = true` |
| Progresso | só o próprio usuário |

**Seed inicial:** curso publicado, módulo `n0` publicado, aulas `0.1` e `0.2` como preview grátis.

Admin preenche `video_url` e libera módulos/aulas via `published = true`.

## Queries úteis

```sql
-- Catálogo completo (como admin)
select * from public.v_course_outline;

-- Promover admin
update public.profiles set role = 'admin' where email = '...';

-- Publicar módulo 1
update public.modules set published = true
where slug = 'n1'
  and course_id = (select id from courses where slug = 'claude-para-advogados');
```
