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
- [ ] 1.4 `repository.ts` → tabelas nativas (remover guard catalog×custom)
- [~] 1.5 Testes unit — `db-course.test.ts` (7 casos) verde; falta cobrir seed-mapping e atualizar merge/ordering na virada
- [ ] 1.6 Verificação F1 (login) + F2 (assistir): build + test + checagem

### Fase 2 — CRUD de seção no admin (P0)
- [ ] 2.1 Repository de módulos (list/create/update/delete/reorder)
- [ ] 2.2 API `/api/admin/modules` (+ reorder) com `assertAdminApi()`
- [ ] 2.3 UI admin: criar/editar/deletar seção + dropdown do modal de aula
- [ ] 2.4 Editar/adicionar vídeo dentro de seção nova
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
