# Gestão de aulas — Plano A: dados + API + blindagem do lado membro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o Supabase ser dono da ordem e das aulas novas (só-Supabase), expor a API de gestão (criar/reordenar/lote/excluir/avaliações) e blindar o lado dos membros (progresso, módulo vazio) — tudo sem tocar a UI ainda.

**Architecture:** `lesson_overrides` ganha `order_index`. Aula "criada no painel" = linha de override sem correspondente no catálogo (`course.yml`). A lógica de ordenação e merge vira **função pura testável** (recebe overrides como argumento; sem Supabase), com `getMergedCourse`/`listLessonsForAdmin` só orquestrando fetch + função pura. `getMergedCourse` passa a incluir custom publicadas, ordenar por ordem efetiva e **dropar módulos vazios**; os contadores de progresso passam a usá-lo.

**Tech Stack:** Next.js 16.2 (App Router, route handlers), Supabase (service role, RLS bypass nas rotas admin), TypeScript strict. Testes: `node --test` (lógica pura) + `curl`/manual. Sem Jest/Vitest.

**Spec:** `docs/superpowers/specs/2026-07-15-gestao-aulas-painel-design.md`

> ⚠️ **AGENTS.md:** esta é uma versão de Next.js com breaking changes. Antes de escrever route handlers, confira `node_modules/next/dist/docs/` (rotas/`NextResponse`) se algo destoar do que você conhece.

> ⚠️ **Migration manual:** a `013` roda **à mão no SQL editor do Supabase** (sem runner automático). Sem ela, as rotas de escrita dão 500 — a Task 12/handoff cobre isso.

---

## Task 0: Branch + capacidade de teste

**Files:** nenhum (setup)

- [ ] **Step 1: Criar branch de feature** (nunca commitar em `main`)

Run: `git checkout -b feature-gestao-aulas-painel`

- [ ] **Step 2: Instalar `tsx`** (runner que resolve TS + o alias `@/`)

O repo usa `node --test`, mas bare node **não** resolve imports `@/…` nem `.ts` sem extensão (confirmado: Node v26 aqui). `tsx` resolve os dois e mantém `node:test`.

Run: `npm install -D tsx`

- [ ] **Step 3: Registrar o script de teste unitário**

Em `package.json`, dentro de `"scripts"`, adicione (lista explícita evita ambiguidade de descoberta/glob):

```json
"test:unit": "tsx --test tests/unit/slug.test.ts tests/unit/ordering.test.ts tests/unit/merge.test.ts"
```

- [ ] **Step 4: Sanidade do runner**

Crie `tests/unit/smoke.test.ts` com um teste trivial (`test("ok", () => assert.equal(1,1))`) e rode `npx tsx --test tests/unit/smoke.test.ts` → PASS. Apague o arquivo depois. Confirma que `tsx --test` roda nesta máquina antes de escrever os testes reais.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tsx + test:unit script for lesson-management logic"
```

---

## Task 1: Migration 013 — `order_index`

**Files:**
- Create: `supabase/migrations/013_lesson_order.sql`

- [ ] **Step 1: Escrever a migration**

```sql
-- Ordena aulas em runtime (reorder por arrastar no painel) e sustenta aulas
-- criadas no painel (linhas de lesson_overrides sem par no catálogo).

alter table public.lesson_overrides
  add column if not exists order_index integer;

create index if not exists lesson_overrides_module_order_idx
  on public.lesson_overrides (module_id, order_index);
```

- [ ] **Step 2: Aplicar à mão no SQL editor do Supabase** (dev/qa primeiro)

Cole o SQL no SQL editor do projeto Supabase e rode. Confirme:
Run (no SQL editor): `select column_name from information_schema.columns where table_name='lesson_overrides' and column_name='order_index';`
Expected: 1 linha (`order_index`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/013_lesson_order.sql
git commit -m "feat(db): add order_index to lesson_overrides (migration 013)"
```

---

## Task 2: Tipos

**Files:**
- Modify: `src/lib/lessons/types.ts`

- [ ] **Step 1: Adicionar `order_index` ao `LessonOverrideRow`**

Em `LessonOverrideRow`, após `published: boolean;`:

```ts
  /** Posição da aula dentro do módulo (null = usa a ordem do catálogo). */
  order_index: number | null;
```

- [ ] **Step 2: Estender `LessonAdminRow`**

Adicione ao final do type `LessonAdminRow`:

```ts
  orderIndex: number | null;
  /** "catalog" = vem do course.yml; "custom" = criada no painel (só-Supabase). */
  origin: "catalog" | "custom";
```

- [ ] **Step 3: Novo tipo de item de feedback**

Adicione ao final do arquivo:

```ts
export type LessonFeedbackItem = {
  rating: number;
  comment: string | null;
  userEmail: string | null;
  createdAt: string;
};
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem novos erros (podem surgir erros esperados nos consumidores de `LessonOverrideRow`/`LessonAdminRow` que serão resolvidos nas próximas tasks; se aparecerem, siga o plano).

- [ ] **Step 5: Commit**

```bash
git add src/lib/lessons/types.ts
git commit -m "feat(lessons): add order_index/origin/feedback-item types"
```

---

## Task 3: Helper `slugify` (TDD)

**Files:**
- Create: `src/lib/lessons/slug.ts`
- Test: `tests/unit/slug.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/unit/slug.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { slugifyLessonTitle, uniqueLessonId } from "@/lib/lessons/slug";

test("slugify: minúsculo, sem acento, hífens", () => {
  assert.equal(slugifyLessonTitle("O que é o Claude"), "o-que-e-o-claude");
});

test("slugify: título vazio/só-símbolos cai no fallback 'aula'", () => {
  assert.equal(slugifyLessonTitle(""), "aula");
  assert.equal(slugifyLessonTitle("!!!"), "aula");
  assert.equal(slugifyLessonTitle("   "), "aula");
});

test("uniqueLessonId: colisão vira sufixo -2, -3", () => {
  const used = new Set(["intro", "intro-2"]);
  assert.equal(uniqueLessonId("intro", used), "intro-3");
  assert.equal(uniqueLessonId("novo", used), "novo");
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:unit`
Expected: FAIL (módulo `slug.ts` não existe).

- [ ] **Step 3: Implementar**

```ts
// src/lib/lessons/slug.ts

/** Slugifica um título para lesson_id: minúsculo, sem acento, não-alfanumérico → hífen. */
export function slugifyLessonTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "aula";
}

/** Garante unicidade dentro do módulo: colisão → sufixo -2, -3… */
export function uniqueLessonId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lessons/slug.ts tests/unit/slug.test.ts
git commit -m "feat(lessons): slugifyLessonTitle + uniqueLessonId with tests"
```

---

## Task 4: Ordenação pura (TDD)

**Files:**
- Create: `src/lib/lessons/ordering.ts`
- Test: `tests/unit/ordering.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
// tests/unit/ordering.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { compareLessons, nextOrderIndex } from "@/lib/lessons/ordering";

const cat = (i, title) => ({ orderIndex: null, catalogIndex: i, title });
const withOrder = (o, title) => ({ orderIndex: o, catalogIndex: null, title });

test("sem order_index: mantém ordem do catálogo", () => {
  const items = [cat(1, "b"), cat(0, "a")];
  items.sort(compareLessons);
  assert.deepEqual(items.map((i) => i.title), ["a", "b"]);
});

test("order_index vence catalogIndex", () => {
  const items = [
    { orderIndex: 5, catalogIndex: 0, title: "a" },
    cat(1, "b"),
  ];
  items.sort(compareLessons);
  assert.deepEqual(items.map((i) => i.title), ["b", "a"]);
});

test("empate: catálogo antes de custom, depois título", () => {
  const items = [withOrder(2, "z-custom"), { orderIndex: 2, catalogIndex: 9, title: "cat" }];
  items.sort(compareLessons);
  assert.deepEqual(items.map((i) => i.title), ["cat", "z-custom"]);
});

test("nextOrderIndex: max da ordem efetiva + 1", () => {
  assert.equal(nextOrderIndex([cat(0, "a"), cat(1, "b")]), 2);
  assert.equal(nextOrderIndex([]), 0);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:unit`
Expected: FAIL (`ordering.ts` não existe).

- [ ] **Step 3: Implementar**

```ts
// src/lib/lessons/ordering.ts

export type Orderable = {
  orderIndex: number | null;
  /** null para aulas criadas no painel (não existem no catálogo). */
  catalogIndex: number | null;
  title: string;
};

/** Ordem efetiva: order_index quando existe, senão a posição no catálogo. */
export function effectiveOrder(item: Orderable): number {
  if (item.orderIndex !== null) return item.orderIndex;
  if (item.catalogIndex !== null) return item.catalogIndex;
  return Number.MAX_SAFE_INTEGER; // custom sem order_index (não deveria ocorrer): fim
}

/** Comparador estável: ordem efetiva → catálogo antes de custom → título. */
export function compareLessons(a: Orderable, b: Orderable): number {
  const ea = effectiveOrder(a);
  const eb = effectiveOrder(b);
  if (ea !== eb) return ea - eb;
  const ca = a.catalogIndex === null ? 1 : 0;
  const cb = b.catalogIndex === null ? 1 : 0;
  if (ca !== cb) return ca - cb;
  return a.title.localeCompare(b.title);
}

/** Próximo order_index ao criar aula nova no módulo. */
export function nextOrderIndex(items: Orderable[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map(effectiveOrder)) + 1;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lessons/ordering.ts tests/unit/ordering.test.ts
git commit -m "feat(lessons): pure ordering helpers with tests"
```

---

## Task 5: Merge puro + `getMergedCourse` (TDD do núcleo)

**Files:**
- Modify: `src/lib/lessons/merge-course.ts`
- Test: `tests/unit/merge.test.ts`

> Importar `merge-course.ts` é seguro no teste: os imports de Supabase/`@/data` são só referenciados dentro de funções (nenhuma conexão no carregamento). `tsx` resolve o alias `@/`.

- [ ] **Step 1: Teste que falha** (núcleo puro `mergeCourseWithOverrides`)

```ts
// tests/unit/merge.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeCourseWithOverrides } from "@/lib/lessons/merge-course";

const course = {
  title: "T", subtitle: "S",
  modules: [
    { id: "m1", title: "M1", description: "", thumbnailGradient: "", lessons: [
      { id: "a", title: "A", duration: "1", description: "" },
      { id: "b", title: "B", duration: "1", description: "" },
    ]},
    { id: "m2", title: "M2", description: "", thumbnailGradient: "", lessons: [
      { id: "c", title: "C", duration: "1", description: "" },
    ]},
  ],
};

test("inclui aula custom publicada no módulo", () => {
  const overrides = [
    { module_id: "m1", lesson_id: "nova", title: "Nova", duration: null, description: null, youtube_id: null, tella: "x", published: true, order_index: 5, updated_at: "" },
  ];
  const merged = mergeCourseWithOverrides(course, overrides);
  const m1 = merged.modules.find((m) => m.id === "m1");
  assert.deepEqual(m1.lessons.map((l) => l.id), ["a", "b", "nova"]);
});

test("reorder via order_index", () => {
  const overrides = [
    { module_id: "m1", lesson_id: "a", order_index: 1, published: true, title: null, duration: null, description: null, youtube_id: null, tella: null, updated_at: "" },
    { module_id: "m1", lesson_id: "b", order_index: 0, published: true, title: null, duration: null, description: null, youtube_id: null, tella: null, updated_at: "" },
  ];
  const merged = mergeCourseWithOverrides(course, overrides);
  assert.deepEqual(merged.modules.find((m) => m.id === "m1").lessons.map((l) => l.id), ["b", "a"]);
});

test("módulo sem aulas publicadas é dropado", () => {
  const overrides = [
    { module_id: "m2", lesson_id: "c", published: false, order_index: null, title: null, duration: null, description: null, youtube_id: null, tella: null, updated_at: "" },
  ];
  const merged = mergeCourseWithOverrides(course, overrides);
  assert.equal(merged.modules.some((m) => m.id === "m2"), false);
});

test("includeUnpublished mantém não-publicadas e módulo", () => {
  const overrides = [
    { module_id: "m2", lesson_id: "c", published: false, order_index: null, title: null, duration: null, description: null, youtube_id: null, tella: null, updated_at: "" },
  ];
  const merged = mergeCourseWithOverrides(course, overrides, { includeUnpublished: true });
  assert.equal(merged.modules.some((m) => m.id === "m2"), true);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:unit`
Expected: FAIL (`mergeCourseWithOverrides` não existe).

- [ ] **Step 3: Refatorar `merge-course.ts`** — extrair função pura + custom + ordenação + drop de módulo vazio

Substitua o corpo de `getMergedCourse` e adicione os helpers. Novo conteúdo relevante:

```ts
import { compareLessons, type Orderable } from "./ordering";

function customLessonFromOverride(
  o: LessonOverrideRow,
): CourseLesson & { published: boolean } {
  return {
    id: o.lesson_id,
    title: o.title ?? o.lesson_id,
    duration: o.duration ?? "",
    description: o.description ?? "",
    youtubeId: o.youtube_id ?? undefined,
    tella: o.tella ?? undefined,
    published: o.published,
  };
}

/** Núcleo puro do merge (sem Supabase) — testável. */
export function mergeCourseWithOverrides(
  course: typeof COURSE,
  overrides: LessonOverrideRow[],
  options?: { includeUnpublished?: boolean },
) {
  const byKey = new Map(overrides.map((o) => [`${o.module_id}:${o.lesson_id}`, o]));

  const modules = course.modules
    .map((mod) => {
      const catalog = mod.lessons.map((lesson, catalogIndex) => {
        const override = byKey.get(`${mod.id}:${lesson.id}`);
        return {
          lesson: applyOverride(lesson, override),
          order: {
            orderIndex: override?.order_index ?? null,
            catalogIndex,
            title: lesson.title,
          } as Orderable,
        };
      });

      const custom = overrides
        .filter(
          (o) =>
            o.module_id === mod.id &&
            !mod.lessons.some((l) => l.id === o.lesson_id),
        )
        .map((o) => ({
          lesson: customLessonFromOverride(o),
          order: {
            orderIndex: o.order_index,
            catalogIndex: null,
            title: o.title ?? o.lesson_id,
          } as Orderable,
        }));

      const lessons = [...catalog, ...custom]
        .filter(({ lesson }) => options?.includeUnpublished || lesson.published)
        .sort((a, b) => compareLessons(a.order, b.order))
        .map(({ lesson }) => lesson);

      return { ...mod, lessons };
    })
    .filter((mod) => mod.lessons.length > 0); // dropa módulo vazio (protege o player)

  return { title: course.title, subtitle: course.subtitle, modules };
}

export async function getMergedCourse(options?: { includeUnpublished?: boolean }) {
  const overrides = await fetchLessonOverrides();
  return mergeCourseWithOverrides(COURSE, overrides, options);
}
```

Mantenha `applyOverride`, `fetchLessonOverrides` e `findMergedLesson` como estão.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:unit`
Expected: PASS. Depois `npx tsc --noEmit` sem erros em `merge-course.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lessons/merge-course.ts tests/unit/merge.test.ts
git commit -m "feat(lessons): include custom lessons, order, drop empty modules in merge"
```

---

## Task 6: Repositório — list ordenada + custom + origin

**Files:**
- Modify: `src/lib/lessons/repository.ts`

- [ ] **Step 1: Reescrever `listLessonsForAdmin`** para incluir custom, ordenar e emitir `origin`/`orderIndex`

No topo, importe os helpers:

```ts
import { compareLessons, type Orderable } from "./ordering";
```

Substitua o corpo do loop de módulos por (mantém `aggregateViews`/`aggregateFeedback` e o bloco de `totals`):

```ts
  const lessons: LessonAdminRow[] = [];

  for (const mod of COURSE.modules) {
    const rows: { row: LessonAdminRow; order: Orderable }[] = [];

    mod.lessons.forEach((lesson, catalogIndex) => {
      const key = `${mod.id}:${lesson.id}`;
      const override = overrideMap.get(key);
      const feedback = feedbackMap.get(key);
      rows.push({
        row: {
          moduleId: mod.id,
          moduleTitle: mod.title,
          lessonId: lesson.id,
          title: override?.title ?? lesson.title,
          duration: override?.duration ?? lesson.duration,
          description: override?.description ?? lesson.description,
          youtubeId: override?.youtube_id ?? lesson.youtubeId ?? null,
          tella: override?.tella ?? lesson.tella ?? null,
          published: override?.published ?? true,
          viewCount: viewMap.get(key) ?? 0,
          feedbackCount: feedback?.count ?? 0,
          avgRating: feedback ? Math.round(feedback.avg * 10) / 10 : null,
          orderIndex: override?.order_index ?? null,
          origin: "catalog",
        },
        order: { orderIndex: override?.order_index ?? null, catalogIndex, title: lesson.title },
      });
    });

    for (const o of overrides) {
      if (o.module_id !== mod.id) continue;
      if (mod.lessons.some((l) => l.id === o.lesson_id)) continue;
      const key = `${mod.id}:${o.lesson_id}`;
      const feedback = feedbackMap.get(key);
      rows.push({
        row: {
          moduleId: mod.id,
          moduleTitle: mod.title,
          lessonId: o.lesson_id,
          title: o.title ?? o.lesson_id,
          duration: o.duration ?? "",
          description: o.description ?? "",
          youtubeId: o.youtube_id ?? null,
          tella: o.tella ?? null,
          published: o.published,
          viewCount: viewMap.get(key) ?? 0,
          feedbackCount: feedback?.count ?? 0,
          avgRating: feedback ? Math.round(feedback.avg * 10) / 10 : null,
          orderIndex: o.order_index,
          origin: "custom",
        },
        order: { orderIndex: o.order_index, catalogIndex: null, title: o.title ?? o.lesson_id },
      });
    }

    rows.sort((a, b) => compareLessons(a.order, b.order));
    for (const r of rows) lessons.push(r.row);
  }
```

O `overrideMap` já existe no topo da função. Mantenha o cálculo de `totals` (loop sobre `lessons`) inalterado.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/lessons/repository.ts
git commit -m "feat(lessons): admin list includes custom lessons, ordered, with origin"
```

---

## Task 7: Repositório — `createLesson` / `reorderModule` / `setPublishedBatch` / `deleteCustomLesson` / `listFeedbackForLesson`

**Files:**
- Modify: `src/lib/lessons/repository.ts`

- [ ] **Step 1: Estender `upsertLessonOverride` com `orderIndex`**

No tipo do parâmetro adicione `orderIndex?: number | null;` e, junto dos outros `if`:

```ts
  if (input.orderIndex !== undefined) payload.order_index = input.orderIndex;
```

- [ ] **Step 2: Erro tipado pra guard de delete + imports**

No topo do arquivo:

```ts
import { slugifyLessonTitle, uniqueLessonId } from "./slug";
import { nextOrderIndex, type Orderable } from "./ordering";

export class CatalogLessonError extends Error {}
```

- [ ] **Step 3: `createLesson`**

```ts
export async function createLesson(input: {
  moduleId: string;
  title: string;
  tella?: string | null;
  youtubeId?: string | null;
  duration?: string | null;
  description?: string | null;
  published: boolean;
}): Promise<LessonAdminRow> {
  const mod = COURSE.modules.find((m) => m.id === input.moduleId);
  if (!mod) throw new Error(`Módulo inexistente: ${input.moduleId}`);

  const overrides = await fetchLessonOverrides();

  const used = new Set<string>(mod.lessons.map((l) => l.id));
  for (const o of overrides) if (o.module_id === mod.id) used.add(o.lesson_id);
  const lessonId = uniqueLessonId(slugifyLessonTitle(input.title), used);

  const moduleItems: Orderable[] = [
    ...mod.lessons.map((l, catalogIndex) => ({
      orderIndex:
        overrides.find((o) => o.module_id === mod.id && o.lesson_id === l.id)
          ?.order_index ?? null,
      catalogIndex,
      title: l.title,
    })),
    ...overrides
      .filter((o) => o.module_id === mod.id && !mod.lessons.some((l) => l.id === o.lesson_id))
      .map((o) => ({ orderIndex: o.order_index, catalogIndex: null, title: o.title ?? o.lesson_id })),
  ];
  const orderIndex = nextOrderIndex(moduleItems);

  const admin = createAdminClient();
  const { error } = await admin.from("lesson_overrides").insert({
    module_id: input.moduleId,
    lesson_id: lessonId,
    title: input.title,
    tella: input.tella ?? null,
    youtube_id: input.youtubeId ?? null,
    duration: input.duration ?? null,
    description: input.description ?? null,
    published: input.published,
    order_index: orderIndex,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error; // corrida de slug estoura no PK (module_id, lesson_id)

  return {
    moduleId: input.moduleId,
    moduleTitle: mod.title,
    lessonId,
    title: input.title,
    duration: input.duration ?? "",
    description: input.description ?? "",
    youtubeId: input.youtubeId ?? null,
    tella: input.tella ?? null,
    published: input.published,
    viewCount: 0,
    feedbackCount: 0,
    avgRating: null,
    orderIndex,
    origin: "custom",
  };
}
```

- [ ] **Step 4: `reorderModule`** (payload `order_index`-only — nunca `published`)

```ts
export async function reorderModule(moduleId: string, lessonIds: string[]): Promise<void> {
  const admin = createAdminClient();
  const rows = lessonIds.map((lesson_id, i) => ({
    module_id: moduleId,
    lesson_id,
    order_index: i,
  }));
  // ON CONFLICT DO UPDATE SET order_index — published/title/tella intactos.
  const { error } = await admin
    .from("lesson_overrides")
    .upsert(rows, { onConflict: "module_id,lesson_id" });
  if (error) throw error;
}
```

- [ ] **Step 5: `setPublishedBatch`** (payload `published`-only)

```ts
export async function setPublishedBatch(
  keys: { moduleId: string; lessonId: string }[],
  published: boolean,
): Promise<void> {
  const admin = createAdminClient();
  const rows = keys.map((k) => ({
    module_id: k.moduleId,
    lesson_id: k.lessonId,
    published,
  }));
  const { error } = await admin
    .from("lesson_overrides")
    .upsert(rows, { onConflict: "module_id,lesson_id" });
  if (error) throw error;
}
```

- [ ] **Step 6: `deleteCustomLesson`** (guard catálogo + cascata analytics)

```ts
export async function deleteCustomLesson(moduleId: string, lessonId: string): Promise<void> {
  const mod = COURSE.modules.find((m) => m.id === moduleId);
  if (mod?.lessons.some((l) => l.id === lessonId)) {
    throw new CatalogLessonError("Aula de catálogo não pode ser removida pelo painel.");
  }
  const admin = createAdminClient();
  const match = { module_id: moduleId, lesson_id: lessonId };
  await admin.from("lesson_views").delete().match(match);
  await admin.from("lesson_feedback").delete().match(match);
  const { error } = await admin.from("lesson_overrides").delete().match(match);
  if (error) throw error;
}
```

- [ ] **Step 7: `listFeedbackForLesson`**

```ts
export async function listFeedbackForLesson(
  moduleId: string,
  lessonId: string,
  limit = 200,
): Promise<{ avg: number | null; count: number; items: LessonFeedbackItem[] }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_feedback")
    .select("*")
    .eq("module_id", moduleId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows = (data ?? []) as LessonFeedbackRow[];
  const emails = new Map<string, string | null>();
  for (const row of rows) {
    if (!row.user_id || emails.has(row.user_id)) continue;
    const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
    emails.set(row.user_id, userData.user?.email ?? null);
  }

  const count = rows.length;
  const avg =
    count > 0
      ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : null;
  const items: LessonFeedbackItem[] = rows.map((r) => ({
    rating: r.rating,
    comment: r.comment,
    userEmail: r.user_id ? emails.get(r.user_id) ?? null : null,
    createdAt: r.created_at,
  }));
  return { avg, count, items };
}
```

Adicione `LessonFeedbackItem` ao import de `./types`.

- [ ] **Step 8: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/lib/lessons/repository.ts
git commit -m "feat(lessons): create/reorder/batch/delete/listFeedback repository fns"
```

---

## Task 8: Blindar contadores de progresso

**Files:**
- Modify: `src/lib/course/progress.ts`
- Modify: `src/lib/admin/members.ts`

- [ ] **Step 1: `progress.ts` — contar via merge (inclui custom, filtra publicadas)**

Troque `countPublishedLessons` inteira por:

```ts
import { getMergedCourse } from "@/lib/lessons/merge-course";

async function countPublishedLessons(): Promise<number> {
  const course = await getMergedCourse(); // já filtra publicadas + inclui custom
  return course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
}
```

Remova os imports que ficam sem uso: `COURSE` (`@/data/course-content`, só usado na função antiga) **e** `fetchLessonOverrides` — `npx tsc --noEmit` / lint acusam.

- [ ] **Step 2: `members.ts` — mesmo denominador**

Troque `countCourseLessons` (sync) por async via merge, e ajuste a chamada:

```ts
import { getMergedCourse } from "@/lib/lessons/merge-course";

async function countCourseLessons(): Promise<number> {
  const course = await getMergedCourse();
  return course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
}
```

Na `listMembersForAdmin`, linha 42, troque:

```ts
  const totalLessons = await countCourseLessons();
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros. Confirme que `COURSE` ainda é usado em `members.ts` (senão remova o import).

- [ ] **Step 4: Commit**

```bash
git add src/lib/course/progress.ts src/lib/admin/members.ts
git commit -m "fix(progress): count custom published lessons in denominator (no >100%)"
```

---

## Task 9: Fechar o crash de módulo vazio (dado + pai, sem violar hooks)

**Files:**
- Modify: `src/components/members/course-area.tsx` (só `pickInitial`, defensivo)
- Verify: `src/app/aulas/[modulo]/[aula]/page.tsx`

> Contexto: o crash (`pickInitial`/`activeLesson` derefando `undefined`) só acontece se `CourseArea` receber um módulo/curso vazio. Duas defesas já fecham o caminho, **sem** mexer na estrutura de hooks:
> 1. **Task 5** faz `getMergedCourse` **dropar módulos vazios** — módulo com todas as aulas despublicadas some do merge.
> 2. A página pai **já** faz `notFound()` quando a aula não está no merge (`aulas/[modulo]/[aula]/page.tsx:47-51`). Despublicar todas as aulas de um módulo → o módulo some do merge → a URL daquela aula cai em 404 e `CourseArea` nunca é montado vazio.
>
> ❌ **Não** adicione early-return dentro de `CourseArea`: há 8 hooks depois da linha 93 (`useEffect`/`useCallback`/`useRef` nas linhas 123/143/150/152/162/178/184/193). Retornar antes deles viola as Rules of Hooks e quebra o `npm run lint`.

- [ ] **Step 1: Confirmar o guard do pai** (só ler, sem mudança)

Confirme em `src/app/aulas/[modulo]/[aula]/page.tsx:47-51` que `findMergedLesson` + `notFound()` cobrem "aula fora do merge".

- [ ] **Step 2: Endurecer `pickInitial`** (defensivo, sem early-return)

Troque os `!` por acesso seguro (não altera o caminho feliz):

```tsx
function pickInitial(
  course: MergedCourse,
  modParam: string | null,
  lessonParam: string | null,
): { moduleId: string; lessonId: string } {
  const mod =
    course.modules.find((m) => m.id === modParam) ?? course.modules[0];
  const lesson =
    mod?.lessons.find((l) => l.id === lessonParam) ?? mod?.lessons[0];
  return { moduleId: mod?.id ?? "", lessonId: lesson?.id ?? "" };
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros e **sem** aviso de `react-hooks/rules-of-hooks` (não introduzimos early-return).

- [ ] **Step 4: Commit**

```bash
git add src/components/members/course-area.tsx
git commit -m "fix(course-area): harden pickInitial; empty-module crash closed by drop-empty + parent notFound"
```

---

## Task 10: Rotas API — `POST` / `DELETE` + `PATCH` estendido

**Files:**
- Modify: `src/app/api/admin/lessons/route.ts`

- [ ] **Step 1: Imports + estender `PATCH` com `orderIndex`**

Ajuste o import:

```ts
import {
  listLessonsForAdmin,
  upsertLessonOverride,
  createLesson,
  deleteCustomLesson,
  CatalogLessonError,
} from "@/lib/lessons/repository";
```

No `PatchBody` adicione `orderIndex?: number | null;` e passe `orderIndex: body.orderIndex` no `upsertLessonOverride`.

- [ ] **Step 2: `POST` (criar aula)**

```ts
type PostBody = {
  moduleId?: string;
  title?: string;
  tella?: string | null;
  youtubeId?: string | null;
  duration?: string | null;
  description?: string | null;
  published?: boolean;
};

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.moduleId || !body.title?.trim()) {
    return NextResponse.json(
      { error: "moduleId e title são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const lesson = await createLesson({
      moduleId: body.moduleId,
      title: body.title.trim(),
      tella: body.tella ?? null,
      youtubeId: body.youtubeId ?? null,
      duration: body.duration ?? null,
      description: body.description ?? null,
      published: body.published ?? true,
    });
    return NextResponse.json({ ok: true, lesson });
  } catch (err) {
    console.error("[api/admin/lessons POST]", err);
    return NextResponse.json({ error: "Erro ao criar aula." }, { status: 500 });
  }
}
```

- [ ] **Step 3: `DELETE` (aula custom)**

```ts
export async function DELETE(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: { moduleId?: string; lessonId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.moduleId || !body.lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    await deleteCustomLesson(body.moduleId, body.lessonId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CatalogLessonError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/admin/lessons DELETE]", err);
    return NextResponse.json({ error: "Erro ao excluir aula." }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/lessons/route.ts
git commit -m "feat(api): POST create + DELETE custom lesson + PATCH order_index"
```

---

## Task 11: Rota `/reorder`

**Files:**
- Create: `src/app/api/admin/lessons/reorder/route.ts`

- [ ] **Step 1: Implementar**

```ts
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { reorderModule } from "@/lib/lessons/repository";

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: { moduleId?: string; lessonIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.moduleId || !Array.isArray(body.lessonIds)) {
    return NextResponse.json(
      { error: "moduleId e lessonIds são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    await reorderModule(body.moduleId, body.lessonIds);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/lessons/reorder]", err);
    return NextResponse.json({ error: "Erro ao reordenar." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/app/api/admin/lessons/reorder/route.ts
git commit -m "feat(api): reorder module route"
```

---

## Task 12: Rota `/batch`

**Files:**
- Create: `src/app/api/admin/lessons/batch/route.ts`

- [ ] **Step 1: Implementar**

```ts
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { setPublishedBatch } from "@/lib/lessons/repository";

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: {
    keys?: { moduleId: string; lessonId: string }[];
    published?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!Array.isArray(body.keys) || typeof body.published !== "boolean") {
    return NextResponse.json(
      { error: "keys[] e published são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    await setPublishedBatch(body.keys, body.published);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/lessons/batch]", err);
    return NextResponse.json({ error: "Erro ao atualizar em lote." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/app/api/admin/lessons/batch/route.ts
git commit -m "feat(api): batch publish/unpublish route"
```

---

## Task 13: Rota `/feedback`

**Files:**
- Create: `src/app/api/admin/lessons/feedback/route.ts`

- [ ] **Step 1: Implementar**

```ts
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/require-admin";
import { listFeedbackForLesson } from "@/lib/lessons/repository";

export async function GET(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");
  if (!moduleId || !lessonId) {
    return NextResponse.json(
      { error: "moduleId e lessonId são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const data = await listFeedbackForLesson(moduleId, lessonId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/admin/lessons/feedback]", err);
    return NextResponse.json({ error: "Erro ao carregar avaliações." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add src/app/api/admin/lessons/feedback/route.ts
git commit -m "feat(api): per-lesson feedback route"
```

---

## Task 14: Verificação end-to-end do backend

**Files:** nenhum (verificação)

- [ ] **Step 1: Rodar toda a suíte unitária**

Run: `npm run test:unit`
Expected: PASS (slug, ordering, merge-course).

- [ ] **Step 2: Build de tipos + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 3: Smoke manual das rotas** (use a skill `run` pra subir `npm run dev`; logue como admin)

Com a migration 013 aplicada em dev, exercite (via UI de rede/DevTools ou `curl` autenticado):
- `POST /api/admin/lessons` cria aula → aparece em `GET /api/admin/lessons` com `origin: "custom"`, no fim do módulo.
- `POST /api/admin/lessons/reorder` com a ordem invertida de um módulo → `GET` reflete a nova ordem; uma aula que estava **despublicada continua despublicada** (não foi republicada).
- `POST /api/admin/lessons/batch` despublica um conjunto → `published:false` no `GET`.
- `DELETE` numa aula de catálogo → **400**; numa custom → some.
- `GET /api/admin/lessons/feedback?...` → `{ avg, count, items }`.

- [ ] **Step 4: Regressão lado membro** (skill `verify`)

Como membro, abra `/area-de-membros` e uma aula em `/aulas/<modulo>/<aula>`: ordem e filtro de publicadas batem; **despublicar todas as aulas de um módulo** → o módulo some do menu e a URL daquela aula retorna **404 (não crash)**; progresso não passa de 100% ao concluir uma custom.

- [ ] **Step 5: Commit final (se houver ajuste)**

```bash
git add -A
git commit -m "test: backend verification for lesson management"
```

---

## Definition of done (Plano A)

- Migration 013 aplicada (dev/qa).
- `npm run test:unit` e `npx tsc --noEmit && npm run lint` verdes.
- Rotas `POST`/`DELETE`/`PATCH`/`/reorder`/`/batch`/`/feedback` funcionando com guardas.
- Lado membro blindado: ordem correta, custom publicadas aparecem, módulo vazio não crasha, progresso ≤ 100%.
- **Próximo:** Plano B (UI do painel) consome estas rotas.
