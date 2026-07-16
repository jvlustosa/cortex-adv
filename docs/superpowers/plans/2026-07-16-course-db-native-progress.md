# PROGRESS — Curso database-oriented

Log vivo da execução em loop (iteração a cada ~20 min). Fonte de requisitos: [PRD](../specs/2026-07-16-course-db-native-prd.md).

- **Branch:** `feature-course-db-native`
- **Regras do loop:** branch dedicada · verificar (`build`/`test`) a cada chunk · **sem push/deploy sem ordem** · parar quando o arco fechar ou travar em algo que exige o usuário.
- **Gate de "pronto" por tarefa:** código + verificação verde + linha no log abaixo.

## Estado das tarefas

### Fase 1 — Camada de dados (P0)
- [x] 1.1 Migração `014_course_native_runtime.sql` escrita (apply manual pendente → Bloqueios)
- [ ] 1.2 Seed `db:seed` do estado efetivo (validar 6 módulos · 34 aulas)
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

## Log de iterações

### Iteração 0 — 2026-07-16 (setup)
- Brainstorm concluído; decisões D1–D6 travadas.
- Branch `feature-course-db-native` criada.
- PRD e PROGRESS escritos.

### Iteração 1 — 2026-07-16 (Fase 1: schema + mapper puro)
- **Feito:** `supabase/migrations/014_course_native_runtime.sql` (colunas de apresentação em `modules`, `youtube_id`/`tella`/`duration`/`description` em `lessons`, relaxa NOT NULLs e dropa `modules_check`); mapper puro `src/lib/lessons/db-course.ts` (row DB → shape de runtime, ordena por `sort_order`, filtra publicados, dropa módulo vazio); `tests/unit/db-course.test.ts` (7 casos) + registrado no script `test:unit`.
- **Verificação:** `npm run test:unit` → **25/25 verde**.
- **Próximo (Iteração 2):** wiring de `getMergedCourse`/`fetchLessonOverrides` p/ ler do DB via service-role usando `mapDbToCourse` (tarefa 1.3), degradando pro catálogo estático se DB indisponível.
