# PROGRESS — Curso database-oriented

Log vivo da execução em loop (iteração a cada ~20 min). Fonte de requisitos: [PRD](../specs/2026-07-16-course-db-native-prd.md).

- **Branch:** `feature-course-db-native`
- **Regras do loop:** branch dedicada · verificar (`build`/`test`) a cada chunk · **sem push/deploy sem ordem** · parar quando o arco fechar ou travar em algo que exige o usuário.
- **Gate de "pronto" por tarefa:** código + verificação verde + linha no log abaixo.

## Estado das tarefas

### Fase 1 — Camada de dados (P0)
- [x] 1.1 Migração `014_course_native_runtime.sql` escrita (apply manual pendente → Bloqueios)
- [x] 1.2 Seed `db:seed` (`scripts/seed-course-db.mjs`, dry-run/--apply) — dry-run OK: **2 módulos · 10 aulas** (conteúdo real do course.yml; "6·34" do marketing é outra fonte, ver Bloqueios)
- [x] 1.3 `getMergedCourse` → leitura DB via `fetchDbCourse` + `mapDbToCourse`, atrás da flag `COURSE_SOURCE=db`, degradando pro catálogo estático se off/vazio/erro
- [x] 1.4 `repository.ts` → despacha p/ `repository-db.ts` (tabelas nativas) atrás da flag; path legado intacto quando off; guard catalog×custom removido no modo DB (tudo editável/deletável)
- [~] 1.5 Testes unit — `db-course.test.ts` (7) verde; merge/ordering seguem verdes (virada não quebrou). Falta: teste do seed-mapping (buildPlan) — baixo valor, dry-run já valida
- [~] 1.6 Verificação: build + tsc + unit **verdes no path default (flag off = zero regressão em login/assistir)**. Verificação do path DB (F1/F2 com COURSE_SOURCE=db) depende dos passos manuais no Supabase → Bloqueios

### Fase 2 — CRUD de seção no admin (P0)
- [x] 2.1 Repository de módulos em `repository-db.ts` (list/create/update/delete/reorder + `resolveCourseId`); delete limpa views/feedback por slug, aulas caem via FK cascade
- [x] 2.2 API `/api/admin/modules` (GET/POST/PATCH/DELETE) + `/reorder`, com `assertAdminApi()` + guard de modo DB (409 se flag off)
- [~] 2.3 UI admin: prop `dbMode` (do server) + painel "Seções" com **criar** e **excluir** + dropdown de criar aula agora inclui seções do DB. Falta: **editar seção** (PATCH) e **reordenar seção** na UI (API já existe)
- [x] 2.4 Adicionar vídeo dentro de seção nova — dropdown do modal inclui seções do DB (inclusive vazias); editar vídeo na seção usa o fluxo de aula existente (repository resolve no modo DB)
- [ ] 2.5 Testes CRUD de módulo + E2E admin

### Fase 3 — Feedback + marketing no DB + fechamento (P1)
- [ ] 3.1 5 importers públicos → leitura DB
- [ ] 3.2 Feedback visível no admin p/ conteúdo do painel
- [ ] 3.3 Lacunas de teste + suíte completa + SUMMARY

## Bloqueios / pendências do usuário
- **[manual, quando F1/F2 prontos]** Aplicar `supabase/migrations/014_course_native_runtime.sql` à mão no SQL editor do Supabase (prod) — não há runner automático.
  - Verificar antes o nome real do check de `modules` (assumido `modules_check`): `select conname from pg_constraint where conrelid='public.modules'::regclass and contype='c';`
- **[manual, depois da 014]** Rodar `npm run db:seed` (service-role) p/ popular o DB do estado efetivo atual.
- **[cutover, por último]** Definir `COURSE_SOURCE=db` no ambiente (server-only) só DEPOIS de 014 + seed aplicados e verificados. Sem a flag, tudo roda no catálogo estático (nada muda). Reversível (basta remover a flag).
- **[DECISÃO Fase 3 — precisa de você]** "Marketing lê do DB / zero drift" conflita com o design atual: o marketing mostra **6 módulos · 34 aulas de propósito** (`COURSE_SCOPE` em `curso-trilha-public.ts` + roadmap `CURSO_NIVEIS`, com "coming soon"), enquanto o conteúdo real (`course.yml`/DB) tem **2 módulos · 10 aulas**. Se o marketing passar a ler o DB, cai de 6→2 e quebra a mensagem de vendas. Opções:
  - **(A)** Marketing continua com `COURSE_SCOPE`/roadmap hardcoded (número aspiracional); só área de membros + admin leem do DB. Menor risco, mas não é "zero drift" total.
  - **(B)** Semear a trilha completa (os 6 módulos) no DB, com os 4 não-produzidos como `published=false`/"em breve"; marketing lê do DB (6), membros veem só publicados (2). Alinha zero-drift, mas exige cadastrar a metadata dos 4 módulos futuros.
  - **(C)** Híbrido: marketing lê do DB os produzidos + mantém `COURSE_SCOPE` como "trilha completa".
  - Fase 1/2 (login, assistir, gerenciar aulas) **não dependem disso** — decisão pode ficar pra quando chegar a Fase 3.

## Log de iterações

### Iteração 0 — 2026-07-16 (setup)
- Brainstorm concluído; decisões D1–D6 travadas.
- Branch `feature-course-db-native` criada.
- PRD e PROGRESS escritos.

### Iteração 1 — 2026-07-16 (Fase 1: schema + mapper puro)
- **Feito:** `supabase/migrations/014_course_native_runtime.sql` (colunas de apresentação em `modules`, `youtube_id`/`tella`/`duration`/`description` em `lessons`, relaxa NOT NULLs e dropa `modules_check`); mapper puro `src/lib/lessons/db-course.ts` (row DB → shape de runtime, ordena por `sort_order`, filtra publicados, dropa módulo vazio); `tests/unit/db-course.test.ts` (7 casos) + registrado no script `test:unit`.
- **Verificação:** `npm run test:unit` → **25/25 verde**.
- **Próximo (Iteração 2):** wiring de `getMergedCourse`/`fetchLessonOverrides` p/ ler do DB via service-role usando `mapDbToCourse` (tarefa 1.3), degradando pro catálogo estático se DB indisponível.

### Iteração 2 — 2026-07-16 (Fase 1: wiring do read DB-native)
- **Feito:** flag de cutover `isDbCourseSource()` (`COURSE_SOURCE=db`) em `src/lib/supabase/enabled.ts`; `fetchDbCourse()` em `merge-course.ts` (lê courses/modules/lessons via service-role, mapeia com `mapDbToCourse`, retorna null → degrada); `getMergedCourse()` agora tenta DB atrás da flag e cai no catálogo estático + overlay se off/vazio/erro; `mergeCourseWithOverrides` retorna `MappedCourse` (módulo com `published: true`) p/ unificar o tipo dos dois caminhos; `.env.example` documenta `COURSE_SOURCE`. Consumidores dos choke points **inalterados**.
- **Decisão nova (D7):** cutover por flag `COURSE_SOURCE=db` (deliberado/reversível) em vez de troca automática — evita servir seed velho (n0/n1) que possa existir nas tabelas dormentes.
- **Verificação:** `npm run test:unit` **25/25** · `npx tsc --noEmit` limpo · `npm run build` **verde**.
- **Próximo (Iteração 3):** tarefa 1.4 — reescrever `repository.ts` (list/create/upsert/reorder/batch/delete + views/feedback) p/ tabelas nativas atrás da mesma flag, removendo o guard catalog×custom. Depois 1.2 (seed do estado efetivo).

### Iteração 3 — 2026-07-16 (Fase 1: seed script + descoberta de escopo)
- **Feito:** `scripts/seed-course-db.mjs` (dry-run por padrão, `--apply` escreve via service-role; dobra `lesson_overrides` + aulas custom; idempotente por slug); `db:seed` repontado (antigo vira `db:seed:legacy`).
- **Verificação:** `npm run db:seed` (dry-run) → **2 módulos · 10 aulas** (comece-aqui, fundacao-pratica). NÃO rodei `--apply` (é passo manual em prod, ver Bloqueios).
- **Descoberta:** o escopo de marketing (6·34) é intencional e vem de outra fonte (`COURSE_SCOPE`/`CURSO_NIVEIS`), não do conteúdo real (2·10). Registrada DECISÃO de Fase 3 nos Bloqueios (A/B/C).
- **Próximo (Iteração 4):** tarefa 1.4 — `repository.ts` → tabelas nativas atrás da flag `COURSE_SOURCE=db`, mantendo assinaturas e removendo guard catalog×custom; views/feedback continuam por slug.

### Iteração 4 — 2026-07-16 (Fase 1: repository DB-native — FASE 1 code-complete)
- **Feito:** `src/lib/lessons/repository-db.ts` (adminContentFromDb, createLessonDb, updateLessonDb, reorderModuleDb, setPublishedBatchDb, deleteLessonDb — resolve curso/módulos, escreve em `lessons`, views/feedback por slug); `repository.ts` refatorado: `listLessonsForAdmin` monta de `adminContentFromCatalog | adminContentFromDb` + agregação compartilhada; 5 funções de escrita despacham pela flag; `listRecentFeedback` resolve títulos via `getMergedCourse` (correto nos 2 modos). Assinaturas das rotas admin inalteradas.
- **Verificação:** `npx tsc --noEmit` limpo · `npm run test:unit` **25/25** · `npm run build` **verde (38/38 páginas)**.
- **Marco:** **Fase 1 code-complete.** Com a flag off (padrão) o comportamento é idêntico ao de hoje (zero regressão). Com `COURSE_SOURCE=db` (após 014+seed) todo o read/write vem do DB.
- **Próximo (Iteração 5):** iniciar Fase 2 — repository de módulos (2.1) + API `/api/admin/modules` (2.2). Independe dos passos manuais do Supabase (é código atrás da mesma flag).

### Iteração 5 — 2026-07-16 (Fase 2: repository + API de seções)
- **Feito:** CRUD de módulos em `repository-db.ts` (`listModulesForAdmin`, `createModule`, `updateModule`, `deleteModule`, `reorderModules`, `resolveCourseId`); rotas `src/app/api/admin/modules/route.ts` (GET/POST/PATCH/DELETE) e `src/app/api/admin/modules/reorder/route.ts`, guardadas por `assertAdminApi()` + guard 409 quando `COURSE_SOURCE` != db. Delete de seção limpa views/feedback por slug; aulas caem por FK cascade.
- **Verificação:** `npx tsc --noEmit` limpo · `npm run build` **verde**, rotas `/api/admin/modules` e `/api/admin/modules/reorder` registradas.
- **Próximo (Iteração 6):** tarefa 2.3 — UI admin (`admin-dashboard.tsx`): botão "criar seção", editar/deletar seção, e incluir seções do DB no dropdown do modal de criar aula. Grande (arquivo ~1600 linhas) — fatiar com cuidado.

### Iteração 6 — 2026-07-16 (Fase 2: UI de seções — criar/excluir + dropdown)
- **Feito:** `admin/page.tsx` passa `dbMode={isDbCourseSource()}`; `admin-dashboard.tsx` recebe `dbMode`, carrega seções via `GET /api/admin/modules` (só no modo DB), painel "Seções" (lista + criar via modal + excluir com confirm), e `moduleOptions` agora funde grupos de aulas + seções do DB → **dá pra adicionar aula/vídeo em seção nova/vazia**. Corrigido lint `no-assign-module-variable` (var `module`→`section`).
- **Verificação:** `npx tsc --noEmit` limpo · `npx eslint` limpo · `npm run build` **verde** (rotas /admin + /api/admin/modules(+reorder) registradas).
- **Nota:** com a flag off, a UI é idêntica à de hoje (painel de seções escondido). Editar/reordenar seção pela UI fica pra Iteração 7 (API PATCH/reorder já existem).
- **Próximo (Iteração 7):** completar 2.3 (editar + reordenar seção na UI) e iniciar 2.5 (testes de CRUD de módulo). Depois Fase 3 (decisão do usuário sobre marketing).
