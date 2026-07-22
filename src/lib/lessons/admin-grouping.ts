import type { LessonAdminRow } from "./types";

// Lógica pura de agrupamento/reordenação de aulas do painel admin. Sem React
// nem Supabase → testável isolada (tests/unit/admin-grouping.test.ts).

export type LessonGroup = {
  moduleId: string;
  moduleTitle: string;
  lessons: LessonAdminRow[];
};

/** Seção mínima necessária pra montar os grupos (inclui módulos vazios). */
export type SectionLike = { moduleId: string; title: string };

const keyOf = (l: LessonAdminRow) => `${l.moduleId}:${l.lessonId}`;

/** Agrupa aulas por módulo preservando a ordem que o backend entregou. */
export function groupByModule(lessons: LessonAdminRow[]): LessonGroup[] {
  const groups: LessonGroup[] = [];
  for (const lesson of lessons) {
    let g = groups.find((x) => x.moduleId === lesson.moduleId);
    if (!g) {
      g = { moduleId: lesson.moduleId, moduleTitle: lesson.moduleTitle, lessons: [] };
      groups.push(g);
    }
    g.lessons.push(lesson);
  }
  return groups;
}

/**
 * Grupos para a tabela "Aulas do curso". No modo DB usa a lista de seções como
 * espinha (ordem + módulos VAZIOS entram como grupo droppable, pra dar pra
 * arrastar aula pra dentro). Fora do modo DB cai no agrupamento simples.
 */
export function buildLessonGroups(
  lessons: LessonAdminRow[],
  sections: SectionLike[],
  dbMode: boolean,
): LessonGroup[] {
  if (!dbMode || sections.length === 0) return groupByModule(lessons);

  const byModule = new Map<string, LessonAdminRow[]>();
  for (const l of lessons) {
    const bucket = byModule.get(l.moduleId) ?? [];
    bucket.push(l);
    byModule.set(l.moduleId, bucket);
  }

  const groups: LessonGroup[] = sections.map((s) => ({
    moduleId: s.moduleId,
    moduleTitle: s.title,
    lessons: byModule.get(s.moduleId) ?? [],
  }));

  // Defensivo: aulas cujo módulo não veio em `sections` ainda aparecem.
  for (const g of groupByModule(lessons)) {
    if (!groups.some((x) => x.moduleId === g.moduleId)) groups.push(g);
  }
  return groups;
}

/** Move uma aula dentro do seu módulo, retornando a lista achatada nova. */
export function moveWithinModule(
  lessons: LessonAdminRow[],
  moduleId: string,
  fromKey: string,
  toKey: string,
): LessonAdminRow[] {
  const modKeys = lessons
    .filter((l) => l.moduleId === moduleId)
    .map(keyOf);
  const from = modKeys.indexOf(fromKey);
  const to = modKeys.indexOf(toKey);
  if (from < 0 || to < 0 || from === to) return lessons;
  modKeys.splice(to, 0, modKeys.splice(from, 1)[0]);

  const byKey = new Map(lessons.map((l) => [keyOf(l), l]));
  const result: LessonAdminRow[] = [];
  const seenModule = new Set<string>();
  for (const l of lessons) {
    if (l.moduleId === moduleId) {
      if (!seenModule.has(moduleId)) {
        seenModule.add(moduleId);
        for (const k of modKeys) result.push(byKey.get(k)!);
      }
    } else {
      result.push(l);
    }
  }
  return result;
}

/**
 * Insere `slug` numa lista de slugs (ordem do módulo destino) na posição
 * `toIndex` (null/fora do range = fim). Núcleo puro do reindex do destino ao
 * mover aula entre módulos — espelhado no servidor (moveLessonDb).
 */
export function insertSlugAt(
  order: string[],
  slug: string,
  toIndex: number | null,
): string[] {
  const without = order.filter((s) => s !== slug);
  const idx =
    toIndex == null ? without.length : Math.max(0, Math.min(toIndex, without.length));
  without.splice(idx, 0, slug);
  return without;
}

/** Insere aula na posição alvo (lista achatada) — update otimista no painel. */
export function insertLessonAt(
  lessons: LessonAdminRow[],
  lesson: LessonAdminRow,
  moduleId: string,
  targetKey: string | null,
  moduleTitle?: string,
): LessonAdminRow[] {
  const dragKey = keyOf(lesson);
  const without = lessons.filter((l) => keyOf(l) !== dragKey);
  const moved: LessonAdminRow = {
    ...lesson,
    moduleId,
    moduleTitle: moduleTitle ?? lesson.moduleTitle,
  };

  const groups = groupByModule(without);
  let group = groups.find((g) => g.moduleId === moduleId);
  if (!group) {
    group = { moduleId, moduleTitle: moved.moduleTitle, lessons: [] };
    groups.push(group);
  }

  let insertAt = group.lessons.length;
  if (targetKey) {
    const idx = group.lessons.findIndex((l) => keyOf(l) === targetKey);
    if (idx >= 0) insertAt = idx;
  }
  group.lessons.splice(insertAt, 0, moved);

  return groups.flatMap((g) => g.lessons);
}

export function lessonIdsForModule(
  lessons: LessonAdminRow[],
  moduleId: string,
): string[] {
  return lessons.filter((l) => l.moduleId === moduleId).map((l) => l.lessonId);
}

export function adjacentModuleId(
  lessons: LessonAdminRow[],
  moduleId: string,
  dir: -1 | 1,
): string | null {
  const groups = groupByModule(lessons);
  const idx = groups.findIndex((g) => g.moduleId === moduleId);
  return groups[idx + dir]?.moduleId ?? null;
}
