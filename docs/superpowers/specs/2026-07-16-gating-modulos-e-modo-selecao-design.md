# Trava por tempo de módulos + modo seleção no admin

Data: 2026-07-16

## Contexto

O painel admin (`src/components/admin/admin-dashboard.tsx`) lista aulas agrupadas
por módulo com checkboxes de seleção em massa **sempre visíveis**. Os módulos
vêm de `src/data/course.yml` → `scripts/build-course-content.mjs` →
`src/data/course-content.ts` (catálogo estático). `getMergedCourse()`
(`src/lib/lessons/merge-course.ts`) junta o catálogo com `lesson_overrides`
(Supabase), mas **só itera sobre os módulos do catálogo**. Já existe um padrão de
liberação por tempo: `computePackAccess(created_at, now, dias)` em
`src/lib/course/packs-access.ts`, com UX de cadeado em `packs-area.tsx`.

## Escopo

Duas entregas. "Adicionar módulo" ficou **fora** desta tarefa (adiado — exige
encanamento de módulo em runtime, decidido em conjunto).

### Feature 1 — Trava por tempo (drip) por módulo

Objetivo: liberar módulos X dias após a criação da conta do aluno. Alvo prático:
módulos 5, 6 e 7 liberam 8 dias após `created_at`. O catálogo hoje tem só 2
módulos e nenhum com trava, então a feature **nasce dormente** — o que se entrega
agora é o *mecanismo* + o *teste* do check. Marcar `unlockAfterDays: 8` nos
módulos reais quando entrarem no `course.yml` ativa a trava.

- **Schema:** campo opcional `unlockAfterDays?: number` no módulo do YAML.
  Ausente ou `0` = liberado na hora.
  - `scripts/build-course-content.mjs`: valida (inteiro ≥ 0 quando presente),
    propaga em `emitModule`, e inclui `unlockAfterDays?: number` no tipo
    `CourseModule` gerado.
  - Rodar `npm run course:build` para regenerar `course-content.ts`.
- **Lógica pura:** `src/lib/course/module-access.ts`
  - `computeModuleAccess(enrolledAtISO, unlockAfterDays, nowMs?) → { isUnlocked, unlockAt }`.
  - Regra: sem `unlockAfterDays` (ou ≤ 0) → liberado; com trava e sem
    `enrolledAt` válido → **travado** (nunca abre por omissão, igual aos packs);
    senão compara `enrolledAt + dias`.
  - Reaproveita `formatUnlockDate` de `packs-access.ts` para a data pt-BR.
- **Enforcement:**
  - Grade (`src/components/aulas/lesson-cards-grid.tsx`): módulo travado mostra
    cadeado + "Libera em DD/MM/AAAA" no lugar do carrossel clicável.
    `area-de-membros/page.tsx` passa `enrolledAt` (= `user.created_at`) e
    `bypassLock` (= `demoMode || isAdmin`).
  - Player (`src/app/aulas/[modulo]/[aula]/page.tsx`): acesso direto a aula de
    módulo travado (sem bypass) → `redirect("/area-de-membros")`. Fecha o
    deep-link.
  - Admin e modo demo (localhost) sempre liberados (preview).
- **Teste:** `tests/unit/module-access.test.ts` (node/tsx `--test`), adicionado ao
  script `test:unit`. Casos: 7 dias → travado; 8 → liberado; 9 → liberado;
  `undefined`/`0` → liberado; trava setada e sem `created_at` → travado;
  `created_at` inválido → travado.

### Feature 2 — Modo seleção no admin

Botão **"Selecionar"** no cabeçalho da seção "Aulas do curso" (ao lado de
"Adicionar aula"). Estado `selectMode`:

- Off (padrão): tabela limpa, checkboxes não renderizados; barra de massa some.
- On: checkbox por linha + "selecionar todas" no cabeçalho do módulo + barra de
  ações em massa (quando há seleção).
- Sair do modo limpa a seleção.

A coluna do checkbox permanece no DOM (evita mexer em `colSpan`); só o `<input>`
é condicional — diff mínimo.

## Fora de escopo

- "Adicionar módulo" em runtime (tabela `module_overrides`, merge de módulos
  custom). Tarefa separada.
- Alterar o cálculo de progresso/certificado (aulas de módulo travado
  continuam contando no denominador; 100% só após liberar — comportamento aceito).

## Verificação

- `npm run test:unit` (inclui o novo teste) verde.
- `npm run course:build` roda sem erro e regenera o `.ts`.
- `npx tsc --noEmit` e `eslint` limpos nos arquivos tocados.
