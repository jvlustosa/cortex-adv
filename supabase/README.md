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

## Cutover: curso no DB + materiais + "em breve" (`COURSE_SOURCE=db`)

Estas migrações **não** estão no `setup-completo.sql` nem na tabela numerada acima —
aplique à mão no **SQL Editor** (todas idempotentes):

| Migração | O que faz |
|----------|-----------|
| `010_lesson_materials.sql` | Tabela `lesson_materials` + bucket **privado** `lesson-materials`. Sem ela, "Materiais da aula" não renderiza (é isto que "ativar o storage" resolve). |
| `014_course_native_runtime.sql` | Alinha `modules/lessons` ao runtime (colunas de apresentação, `tella`, `duration`, etc.). |
| `015_module_coming_soon.sql` | Coluna `modules.coming_soon` — módulo "em breve" gerido pelo painel. |
| `016_seed_trilha_coming_soon_modules.sql` | Insere os 6 módulos da trilha (Economia → Encerramento) com `coming_soon=true`. |

Ordem do cutover:

1. SQL Editor: rode `010`, `014`, `015`, depois `016` (ou `016` após o seed do curso).
2. Seed do conteúdo atual (lê `src/data/course.yml`, upsert por slug — curso `claude-cowork-advogados`):
   ```bash
   npm run db:seed            # dry-run: mostra o plano, não escreve
   npm run db:seed -- --apply # grava no Supabase (usa SUPABASE_SERVICE_ROLE_KEY do .env.local)
   ```
3. Confira em **Table editor** que `courses/modules/lessons` têm o conteúdo.
4. **Vercel** → projeto `claude-academy` → Settings → Environment Variables:
   `COURSE_SOURCE=db` → **Redeploy** (o env é inlined no build; sem redeploy não vale).
5. Verifique `/admin` — o bloco **Seções** aparece (criar / editar / reordenar / marcar "Em breve").

**Rollback:** remova `COURSE_SOURCE` (ou deixe `!= db`) no Vercel e redeploy — volta pro
`course.yml` na hora. O YAML continua no repo como fonte de fallback.

**Materiais:** com a `010` aplicada, suba arquivos por aula no `/admin` (ícone de clipe na
linha da aula). O aluno baixa via URL assinada de curta duração; o bucket é privado, sem
exposição pública.

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
