# PRD — Curso 100% database-oriented (Claude Academy)

- **Data:** 2026-07-16
- **Branch:** `feature-course-db-native`
- **Autor:** Vitor + Claude
- **Status:** em execução (loop 20 min)
- **Docs relacionados:** [PROGRESS](../plans/2026-07-16-course-db-native-progress.md)

## 1. Contexto e problema

Hoje o conteúdo do curso vive em **três fontes que divergem**:

1. `src/data/course.yml` → `src/data/course-content.ts` (`COURSE`) — **fonte de runtime real** (módulos `comece-aqui`, etc.), compilada em build.
2. `scripts/curso-roteiro-data.mjs` → `supabase/migrations/006_seed_curso.sql` — **seed velho e defasado** (esquema `n0`/`n1`).
3. Tabelas nativas `courses`/`modules`/`lessons` (migrations 003/005/006/007) — **dormentes, nunca lidas em runtime**.

Edições do admin caem numa tabela de overlay (`lesson_overrides`), sobreposta ao `COURSE` estático via `mergeCourseWithOverrides`. Módulos ("seções") **não podem ser criados/editados** pelo painel — só via YAML + rebuild, o que não roda em runtime na Vercel.

**Objetivo:** tornar o DB a **única fonte da verdade** do conteúdo do curso. Admin cria/edita/reordena/publica **módulos e aulas** direto no Supabase; membros e páginas de marketing leem do DB. YAML vira **apenas seed inicial**.

## 2. Objetivos e não-objetivos

### Objetivos
- DB como fonte única de curso → módulo → aula (com vídeo).
- Admin: CRUD completo de **aulas** e **seções (módulos)**, incluindo adicionar vídeo dentro de seções e reordenar.
- Feedback (nota 1–5 + comentário) do aluno **visível no admin**, inclusive para conteúdo criado no painel.
- **Zero drift**: marketing/certificado também leem do DB.
- Preservar 100% do conteúdo e edições atuais na migração (nada se perde).
- Testes cobrindo mapeamento, ordenação, filtro de publicação e CRUD.

### Não-objetivos
- Upload de arquivo de vídeo (segue embed YouTube/Tella).
- Novo sistema de RBAC — permanece `admin_users` + domínio de e-mail.
- Feature nova de "anotações privadas do aluno" (fora de escopo; "nota" = rating existente).
- Discussão/threads — comentário continua sendo o campo do feedback.

## 3. Decisões travadas (com racional)

| # | Decisão | Racional |
|---|---------|----------|
| D1 | **Abordagem B** — DB-native usando `courses`/`modules`/`lessons` | Usuário pediu "database oriented"; tabelas já existem. |
| D2 | **course.yml vira seed** (não removido) | Autoria em massa versionada; DB é fonte de runtime após seed. |
| D3 | **Vídeo = `youtube_id` + `tella`** (Tella tem prioridade) | Espelha o player atual; não mexe na lógica de embed. |
| D4 | **Escrita: service-role + `assertAdminApi()`**; RLS como defesa em profundidade | Consistente com o que já roda; evita reconciliar `admin_users` × `users.role`. |
| D5 | **Tudo no DB (zero drift)** — marketing/certificado incluídos | Escolha do usuário; consistência total. |
| D6 | **Distinção catalog×custom some** — toda aula/módulo é editável e deletável | É o ponto do DB-oriented. |

## 4. Fluxos prioritários (não podem quebrar) e critérios de aceite

### F1 — Login (P0)
- Login por magic link / senha funciona igual. Detecção de admin (`admin_users` + domínio) ainda gate `/admin`. Ban/unban intacto.
- **Aceite:** logar como membro → cai em `/area-de-membros`; logar como admin → acessa `/admin`; não-admin em `/admin` → redirect.

### F2 — Assistir aula (P0)
- `/aulas/[modulo]/[aula]` resolve do DB; vídeo toca (Tella > YouTube > placeholder); "concluir aula" grava em `lesson_views` (chave = slug); feedback grava/atualiza; barra de progresso e materiais OK; gating `unlockAfterDays` preservado.
- **Aceite:** abrir uma aula publicada → vídeo carrega; concluir → persiste; recarregar → estado mantém.

### F3 — Gerenciar aulas (P0)
- Admin lista aulas por módulo, edita (título/vídeo/duração/descrição/publicado), cria aula, reordena (drag + teclado), publica/despublica em lote, deleta — **tudo grava no DB**.
- Criar **seção (módulo)** nova, editar e deletar; adicionar vídeo dentro dela.
- **Aceite:** cada ação reflete imediatamente no painel e na área de membros após reload; CRUD guardado por `assertAdminApi()`.

### F4 — Feedback visível (P1)
- Modal de feedback por aula + lista de recentes mostram nota + comentário, inclusive para aulas/seções criadas no painel.

## 5. Arquitetura alvo

**Choke points preservados** (assinatura/shape inalterados → consumidores não mudam):
- `getMergedCourse(opts?)` / `findMergedLesson(course, mod, aula)` — passam a ler do DB.
- `repository.ts` — passa a escrever/ler tabelas nativas.

**Mapa DB → shape de runtime:**
- `Course` = `{ title: courses.title, subtitle: courses.subtitle, modules }`
- `CourseModule` = `{ id: modules.slug, title, description, thumbnailGradient: thumbnail_gradient, coverImage: cover_image, unlockAfterDays: unlock_after_days, lessons }`
- `CourseLesson` = `{ id: lessons.slug, title, duration, youtubeId: youtube_id, tella, description }`
- Ordenação: `modules.sort_order`, depois `lessons.sort_order`.
- Filtro de publicação: não-admin vê só `course.published && module.published && lesson.published`; `includeUnpublished` ignora.

**Chaves de views/feedback:** continuam sendo os **slugs** (`module.slug`, `lesson.slug`) — iguais aos ids atuais → nenhum view/feedback se perde.

## 6. Modelo de dados — migração de schema

Nova migração `supabase/migrations/014_course_native_runtime.sql` (aplicada **à mão no SQL editor**; não há runner automático):

```sql
-- courses: subtitle p/ fidelidade ao shape de runtime
alter table public.courses add column if not exists subtitle text;

-- modules: colunas de apresentação que o runtime usa
alter table public.modules add column if not exists description text;
alter table public.modules add column if not exists thumbnail_gradient text;
alter table public.modules add column if not exists cover_image text;
alter table public.modules add column if not exists unlock_after_days int not null default 0;
-- seções criadas no painel não têm level_key/level_num → relaxar
alter table public.modules alter column level_key drop not null;
-- remover o check que exige level_num quando level_key<>'bonus'
-- (confirmar nome real via information_schema; provável `modules_check`)
alter table public.modules drop constraint if exists modules_check;

-- lessons: vídeo no shape do player + descrição/duração de exibição
alter table public.lessons add column if not exists youtube_id text;
alter table public.lessons add column if not exists tella text;
alter table public.lessons add column if not exists duration text;
alter table public.lessons add column if not exists description text;
alter table public.lessons alter column objective drop not null;
alter table public.lessons alter column duration_minutes drop not null;
```

> `video_url`/`video_provider`/`objective`/`duration_minutes`/`badge`/`content_md` ficam sem uso pelo runtime (não removidos nesta fase para não quebrar migrations antigas).

## 7. Seed — course.yml (+ overrides atuais) → DB

Script de migração única (Node + service-role, no estilo `scripts/create-admin.mjs`), exposto em `npm run db:seed`:
1. Roda `mergeCourseWithOverrides(COURSE, <overrides atuais>, { includeUnpublished: true })` para capturar o **estado efetivo atual** (YAML + edições do painel + ordenação + publicação).
2. Upsert idempotente: 1 `courses`, N `modules` (`sort_order` = índice), M `lessons` (`sort_order` = índice, `published` = flag efetiva, vídeo/duração/descrição do estado efetivo).
3. Chaves: `courses.slug='claude-cowork-advogados'`, `modules.slug`=id do módulo, `lessons.slug`=id da aula.

> Reescrever/aposentar `scripts/generate-course-seed.mjs` (lê fonte velha `curso-roteiro-data.mjs`). Passa a ler `course.yml`.

## 8. Fases e tarefas (ordem de execução do loop)

### Fase 1 — Camada de dados (P0, base invisível)
- [ ] 1.1 Migração `014_course_native_runtime.sql` + confirmar nome do check em `modules`.
- [ ] 1.2 Script de seed (`db:seed`) a partir do estado efetivo atual; validar contagem (6 módulos · 34 aulas).
- [ ] 1.3 Reescrever miolo de `getMergedCourse`/`fetchLessonOverrides` → leitura DB, **mantendo shape**. `findMergedLesson` inalterado.
- [ ] 1.4 Reescrever `repository.ts` (list/create/upsert/reorder/batch/delete + views/feedback) → tabelas nativas; remover guard catalog×custom.
- [ ] 1.5 Testes `tsx --test`: mapeamento row→shape, ordenação por sort_order, filtro published, seed-mapping. Atualizar `merge`/`ordering` tests.
- [ ] 1.6 Verificação F1+F2: `npm run build`, `npm test`, e checar login + assistir manualmente/E2E.

### Fase 2 — CRUD de seção (módulo) no admin (P0)
- [ ] 2.1 Repository: `listModules`, `createModule`, `updateModule`, `deleteModule`, `reorderModules` (DB).
- [ ] 2.2 API: rota admin de módulos (`/api/admin/modules` GET/POST/PATCH/DELETE) + reorder, guardadas por `assertAdminApi()`.
- [ ] 2.3 UI admin: botão "criar seção", editar/deletar módulo, dropdown do modal de aula inclui seções novas.
- [ ] 2.4 Garantir editar/adicionar vídeo dentro de seção nova (reusa fluxo de aula).
- [ ] 2.5 Testes de CRUD de módulo + E2E do fluxo admin.

### Fase 3 — Feedback + marketing no DB + fechamento (P1)
- [ ] 3.1 Migrar os 5 importers públicos (`curso`, `course-hero`, `sales/course-roadmap`, `certificado`, `certificate-preview`) para leitura DB (server-side, cache adequado).
- [ ] 3.2 Garantir feedback (nota+comentário) visível no admin para conteúdo criado no painel.
- [ ] 3.3 Cobrir lacunas de teste; rodar suíte completa + build; atualizar PROGRESS e SUMMARY.

## 9. Permissões (verificar em cada fase)
- Toda escrita de conteúdo passa por `assertAdminApi()` (service-role). RLS das tabelas nativas fica ativa como defesa (leitura pública só de publicado; escrita só admin) — não é o gate primário, mas não deve bloquear o service-role.
- Leitura de membro passa por `requireCourseAccess()` + filtro de publicação.

## 10. Riscos e mitigação
- **Perda de edições do painel na migração** → seed a partir do estado *efetivo* (merge), não do YAML cru. Validar contagens e amostrar aulas editadas antes de cortar.
- **Drift slug × id** → manter slug = id atual; views/feedback continuam por slug.
- **Constraint `modules_check`** quebra seção nova → dropar/relaxar na 014 (confirmar nome).
- **Página pública lendo DB** (Fase 3) → usar service-role server-side + cache/revalidate; nunca expor service key ao client.
- **Migração aplicada à mão** → PROGRESS marca claramente o passo manual pendente no Supabase; código degrada pro catálogo estático se DB indisponível (padrão atual de `fetchLessonOverrides`).

## 11. Estratégia de testes
- **Unit (`tsx --test`)**: mapeamento DB-row→shape, `sort_order`, filtro published, merge/ordering atualizados, seed-mapping.
- **Auth/security (`node --test`)**: sem regressão nas suítes existentes.
- **E2E (Playwright)**: login, assistir (abrir aula + concluir), fluxo admin de gerenciar aula/seção.
- Gate: `npm run build` + `npm test` + `npm run test:unit` verdes antes de declarar qualquer fase concluída.

## 12. Rollout
1. Aplicar `014_...sql` à mão no SQL editor do Supabase (prod).
2. Rodar `npm run db:seed` (service-role) → popular DB do estado atual.
3. Deploy só após F1/F2/F3 verdes e **ordem explícita** do usuário (nunca deploy prod sem pedido).
