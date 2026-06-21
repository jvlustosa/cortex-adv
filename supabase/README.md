# Supabase — Claude Academy

Projeto dedicado à área de membros e catálogo de aulas.

## Estrutura

```
migrations/
  001_invite_tokens.sql   # Convites de cadastro (já existia)
  002_users.sql           # Espelho auth.users → public.users + trigger
  003_course_tables.sql   # courses, modules, lessons
  004_lesson_progress.sql # Progresso por aluno
  005_rls_policies.sql    # Row Level Security
  006_seed_curso.sql      # Roteiro completo (34 aulas)
  007_views.sql           # Views de leitura
  008_auth_users_mirror.sql # Espelho auth → public.users (cria ou migra de profiles)
```

## Modelo (básico)

```
auth.users  ──trigger──►  public.users (espelho, role: student | admin)

courses
    └── modules (níveis 0–5 + bonus)
            └── lessons (microaulas + video_url)

lesson_progress (user_id + lesson_id)
```

## Setup no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (ex.: `claude-academy`).

2. **SQL Editor** — ordem para rodar do zero:

| # | Arquivo |
|---|---------|
| 1 | `migrations/000_reset.sql` — só se já rodou algo antes |
| 2 | `setup-completo.sql` |
| 3 | `migrations/003_course_tables.sql` |
| 4 | `migrations/004_lesson_progress.sql` |
| 5 | `migrations/005_rls_policies.sql` |
| 6 | `migrations/006_seed_curso.sql` |
| 7 | `migrations/007_views.sql` |

Não rode `002_users.sql` nem `008` se já executou `setup-completo.sql` (users já está incluso).

3. **Authentication → Providers → Email** → habilitado.

   - **URL Configuration:** Site URL = `https://claudeacademy.chatjuridico.com.br`;
     Redirect URLs com `https://claudeacademy.chatjuridico.com.br/**` e `http://localhost:3000/**`.
   - **Email Templates:** aplique os templates de [`templates/`](templates/README.md). O Magic Link
     **precisa** apontar para `/auth/confirm?token_hash=…&type=magiclink` — senão o login falha
     com `error=link`.

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

6. Cadastre admins do painel:

```bash
npm run admin:create
# ou com login auth + senha temporária:
npm run admin:create -- --provision
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
update public.users set role = 'admin' where email = '...';

-- Publicar módulo 1
update public.modules set published = true
where slug = 'n1'
  and course_id = (select id from courses where slug = 'claude-para-advogados');
```
