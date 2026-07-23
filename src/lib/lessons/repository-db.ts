import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonAdminRow, LessonOverrideRow } from "./types";
import { slugifyLessonTitle, uniqueLessonId } from "./slug";
import { insertSlugAt } from "./admin-grouping";

// Implementação DB-native do repositório de aulas (tabelas courses/modules/
// lessons). Ativa quando COURSE_SOURCE=db; o repository.ts despacha pra cá.
// views/feedback continuam por slug (module_id/lesson_id = slug) e vivem no
// repository.ts (compartilhados entre os dois modos).

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

export type AdminContentLesson = {
  lessonId: string;
  title: string;
  duration: string;
  description: string;
  youtubeId: string | null;
  tella: string | null;
  published: boolean;
  orderIndex: number | null;
  origin: "catalog" | "custom";
  catalogIndex: number | null;
};

export type AdminContentModule = {
  moduleId: string;
  moduleTitle: string;
  lessons: AdminContentLesson[];
};

type ModuleRec = { id: string; slug: string; title: string; sort_order: number };

/** Curso único do projeto (primeiro por sort_order). */
async function resolveCourseId(admin: SupabaseAdmin): Promise<string | null> {
  const { data, error } = await admin
    .from("courses")
    .select("id")
    .order("sort_order", { ascending: true })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as { id: string } | undefined)?.id ?? null;
}

/** Resolve o curso único e seus módulos ordenados. */
async function loadModules(
  admin: SupabaseAdmin,
): Promise<{ courseId: string | null; modules: ModuleRec[] }> {
  const courseId = await resolveCourseId(admin);
  if (!courseId) return { courseId: null, modules: [] };

  const { data: modules, error: mErr } = await admin
    .from("modules")
    .select("id, slug, title, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });
  if (mErr) throw mErr;
  return { courseId, modules: (modules ?? []) as ModuleRec[] };
}

function requireModule(modules: ModuleRec[], moduleSlug: string): ModuleRec {
  const mod = modules.find((m) => m.slug === moduleSlug);
  if (!mod) throw new Error(`Módulo inexistente: ${moduleSlug}`);
  return mod;
}

/** Conteúdo p/ o painel admin no modo DB-native. Todas as aulas são editáveis e
 *  deletáveis (origin "custom") — não há mais distinção catálogo×custom. */
export async function adminContentFromDb(): Promise<AdminContentModule[]> {
  const admin = createAdminClient();
  const { courseId, modules } = await loadModules(admin);
  if (!courseId || modules.length === 0) return [];

  const { data: lessons, error } = await admin
    .from("lessons")
    .select(
      "module_id, slug, title, duration, youtube_id, tella, description, sort_order, published",
    )
    .in(
      "module_id",
      modules.map((m) => m.id),
    )
    .order("sort_order", { ascending: true });
  if (error) throw error;

  type Row = {
    module_id: string;
    slug: string;
    title: string;
    duration: string | null;
    youtube_id: string | null;
    tella: string | null;
    description: string | null;
    sort_order: number;
    published: boolean;
  };

  const byModule = new Map<string, AdminContentLesson[]>();
  for (const l of (lessons ?? []) as Row[]) {
    const bucket = byModule.get(l.module_id) ?? [];
    bucket.push({
      lessonId: l.slug,
      title: l.title,
      duration: l.duration ?? "",
      description: l.description ?? "",
      youtubeId: l.youtube_id ?? null,
      tella: l.tella ?? null,
      published: l.published,
      orderIndex: l.sort_order,
      origin: "custom",
      catalogIndex: null,
    });
    byModule.set(l.module_id, bucket);
  }

  return modules.map((m) => ({
    moduleId: m.slug,
    moduleTitle: m.title,
    lessons: byModule.get(m.id) ?? [],
  }));
}

export async function createLessonDb(input: {
  moduleId: string;
  title: string;
  tella?: string | null;
  youtubeId?: string | null;
  duration?: string | null;
  description?: string | null;
  published: boolean;
}): Promise<LessonAdminRow> {
  const admin = createAdminClient();
  const { modules } = await loadModules(admin);
  const mod = requireModule(modules, input.moduleId);

  const { data: existing, error: exErr } = await admin
    .from("lessons")
    .select("slug, sort_order")
    .eq("module_id", mod.id);
  if (exErr) throw exErr;
  const rows = (existing ?? []) as { slug: string; sort_order: number }[];

  const used = new Set(rows.map((r) => r.slug));
  const lessonId = uniqueLessonId(slugifyLessonTitle(input.title), used);
  const sortOrder =
    rows.reduce((max, r) => Math.max(max, r.sort_order ?? -1), -1) + 1;

  const { error } = await admin.from("lessons").insert({
    module_id: mod.id,
    slug: lessonId,
    title: input.title,
    duration: input.duration ?? null,
    youtube_id: input.youtubeId ?? null,
    tella: input.tella ?? null,
    description: input.description ?? null,
    sort_order: sortOrder,
    published: input.published,
  });
  if (error) throw error; // corrida de slug estoura no unique (module_id, slug)

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
    viewers: [],
    feedbackCount: 0,
    avgRating: null,
    orderIndex: sortOrder,
    origin: "custom",
  };
}

/** Edição de aula no modo DB. Retorna no shape LessonOverrideRow p/ compat da
 *  API (a rota PATCH devolve { override }). */
export async function updateLessonDb(input: {
  moduleId: string;
  lessonId: string;
  youtubeId?: string | null;
  tella?: string | null;
  duration?: string | null;
  title?: string | null;
  description?: string | null;
  published?: boolean;
  orderIndex?: number | null;
}): Promise<LessonOverrideRow> {
  const admin = createAdminClient();
  const { modules } = await loadModules(admin);
  const mod = requireModule(modules, input.moduleId);

  const patch: Record<string, unknown> = {};
  if (input.youtubeId !== undefined) patch.youtube_id = input.youtubeId;
  if (input.tella !== undefined) patch.tella = input.tella;
  if (input.duration !== undefined) patch.duration = input.duration;
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.published !== undefined) patch.published = input.published;
  if (input.orderIndex !== undefined) patch.sort_order = input.orderIndex;

  const { data, error } = await admin
    .from("lessons")
    .update(patch)
    .eq("module_id", mod.id)
    .eq("slug", input.lessonId)
    .select(
      "title, duration, youtube_id, tella, description, published, sort_order, updated_at",
    )
    .single();
  if (error) throw error;

  const row = data as {
    title: string | null;
    duration: string | null;
    youtube_id: string | null;
    tella: string | null;
    description: string | null;
    published: boolean;
    sort_order: number | null;
    updated_at: string | null;
  };

  return {
    module_id: input.moduleId,
    lesson_id: input.lessonId,
    youtube_id: row.youtube_id ?? null,
    tella: row.tella ?? null,
    duration: row.duration ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
    published: row.published,
    order_index: row.sort_order ?? null,
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

/** Move aula entre módulos (ou reordena no mesmo). Atualiza views/feedback/materiais
 *  (chaves por slug) quando o módulo muda. */
export async function reorderModuleDb(
  moduleSlug: string,
  lessonIds: string[],
): Promise<void> {
  const admin = createAdminClient();
  const { modules } = await loadModules(admin);
  const mod = requireModule(modules, moduleSlug);

  // Poucas aulas por módulo → updates sequenciais, sort_order = posição.
  for (let i = 0; i < lessonIds.length; i++) {
    const { error } = await admin
      .from("lessons")
      .update({ sort_order: i })
      .eq("module_id", mod.id)
      .eq("slug", lessonIds[i]);
    if (error) throw error;
  }
}

/**
 * Move uma aula para OUTRO módulo (modo DB). Atualiza module_id, reindexa
 * origem e destino, e migra views/feedback (chaveados por slug) para preservar
 * histórico. `toIndex` = posição desejada no destino (null = fim). Se o slug já
 * existir no destino, gera um slug único lá. No-op se from == to.
 */
export async function moveLessonDb(input: {
  lessonSlug: string;
  fromModuleSlug: string;
  toModuleSlug: string;
  toIndex?: number | null;
  beforeLessonSlug?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { modules } = await loadModules(admin);
  const from = requireModule(modules, input.fromModuleSlug);
  const to = requireModule(modules, input.toModuleSlug);

  if (from.id === to.id) {
    const { data: sameRows, error: sameErr } = await admin
      .from("lessons")
      .select("slug")
      .eq("module_id", from.id)
      .order("sort_order", { ascending: true });
    if (sameErr) throw sameErr;
    const order = (sameRows ?? []).map((r) => (r as { slug: string }).slug);
    let toIndex = input.toIndex ?? null;
    if (input.beforeLessonSlug) {
      const without = order.filter((s) => s !== input.lessonSlug);
      const idx = without.indexOf(input.beforeLessonSlug);
      toIndex = idx >= 0 ? idx : without.length;
    }
    const next = insertSlugAt(order, input.lessonSlug, toIndex);
    await reorderModuleDb(input.fromModuleSlug, next);
    return;
  }

  const { data: destRows, error: dErr } = await admin
    .from("lessons")
    .select("slug, sort_order")
    .eq("module_id", to.id);
  if (dErr) throw dErr;
  const dest = (destRows ?? []) as { slug: string; sort_order: number }[];
  const destSlugs = new Set(dest.map((r) => r.slug));

  // Mantém o slug; só re-sluga se colidir no destino (raro).
  const newSlug = destSlugs.has(input.lessonSlug)
    ? uniqueLessonId(input.lessonSlug, destSlugs)
    : input.lessonSlug;

  const provisionalOrder =
    dest.reduce((max, r) => Math.max(max, r.sort_order ?? -1), -1) + 1;

  const { error: upErr } = await admin
    .from("lessons")
    .update({ module_id: to.id, slug: newSlug, sort_order: provisionalOrder })
    .eq("module_id", from.id)
    .eq("slug", input.lessonSlug);
  if (upErr) throw upErr;

  // views/feedback são chaveados por (slug do módulo, slug da aula) — migra pra
  // não orfanar o histórico ao trocar de módulo.
  const oldMatch = { module_id: input.fromModuleSlug, lesson_id: input.lessonSlug };
  const newKey = { module_id: input.toModuleSlug, lesson_id: newSlug };
  const { error: vErr } = await admin.from("lesson_views").update(newKey).match(oldMatch);
  if (vErr) throw vErr;
  const { error: fErr } = await admin.from("lesson_feedback").update(newKey).match(oldMatch);
  if (fErr) throw fErr;
  const { error: mErr } = await admin.from("lesson_materials").update(newKey).match(oldMatch);
  if (mErr) throw mErr;

  // Reindexa destino inserindo na posição pedida, depois fecha o buraco na origem.
  let toIndex = input.toIndex ?? null;
  if (input.beforeLessonSlug) {
    const without = dest.map((r) => r.slug).filter((s) => s !== newSlug);
    const idx = without.indexOf(input.beforeLessonSlug);
    toIndex = idx >= 0 ? idx : without.length;
  }
  const destOrder = insertSlugAt(
    dest.map((r) => r.slug),
    newSlug,
    toIndex,
  );
  await reorderModuleDb(input.toModuleSlug, destOrder);

  const { data: srcRows, error: sErr } = await admin
    .from("lessons")
    .select("slug")
    .eq("module_id", from.id)
    .order("sort_order", { ascending: true });
  if (sErr) throw sErr;
  await reorderModuleDb(
    input.fromModuleSlug,
    (srcRows ?? []).map((r) => (r as { slug: string }).slug),
  );
}

export async function setPublishedBatchDb(
  keys: { moduleId: string; lessonId: string }[],
  published: boolean,
): Promise<void> {
  const admin = createAdminClient();
  const { modules } = await loadModules(admin);
  const idBySlug = new Map(modules.map((m) => [m.slug, m.id]));

  for (const k of keys) {
    const moduleId = idBySlug.get(k.moduleId);
    if (!moduleId) continue;
    const { error } = await admin
      .from("lessons")
      .update({ published })
      .eq("module_id", moduleId)
      .eq("slug", k.lessonId);
    if (error) throw error;
  }
}

/** Deleta a aula + seus views/feedback (por slug). No modo DB toda aula pode ser
 *  removida (sem guard de catálogo). */
export async function deleteLessonDb(
  moduleSlug: string,
  lessonSlug: string,
): Promise<void> {
  const admin = createAdminClient();
  const { modules } = await loadModules(admin);
  const mod = modules.find((m) => m.slug === moduleSlug);
  if (!mod) return;

  const match = { module_id: moduleSlug, lesson_id: lessonSlug };
  const { error: viewsErr } = await admin.from("lesson_views").delete().match(match);
  if (viewsErr) throw viewsErr;
  const { error: fbErr } = await admin.from("lesson_feedback").delete().match(match);
  if (fbErr) throw fbErr;
  const { error } = await admin
    .from("lessons")
    .delete()
    .eq("module_id", mod.id)
    .eq("slug", lessonSlug);
  if (error) throw error;
}

// ── Seções (módulos) — CRUD DB-native (Fase 2) ──────────────────────────────

export type ModuleAdminRow = {
  moduleId: string; // slug
  title: string;
  description: string;
  thumbnailGradient: string;
  coverImage: string | null;
  unlockAfterDays: number;
  sortOrder: number;
  published: boolean;
  comingSoon: boolean;
  lessonCount: number;
};

type ModuleRowFull = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_gradient: string | null;
  cover_image: string | null;
  unlock_after_days: number | null;
  sort_order: number;
  published: boolean;
  coming_soon: boolean | null;
};

export async function listModulesForAdmin(): Promise<ModuleAdminRow[]> {
  const admin = createAdminClient();
  const courseId = await resolveCourseId(admin);
  if (!courseId) return [];

  const { data, error } = await admin
    .from("modules")
    .select(
      "id, slug, title, description, thumbnail_gradient, cover_image, unlock_after_days, sort_order, published, coming_soon",
    )
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const mods = (data ?? []) as ModuleRowFull[];

  const { data: lessons, error: lErr } = await admin
    .from("lessons")
    .select("module_id")
    .in(
      "module_id",
      mods.map((m) => m.id),
    );
  if (lErr) throw lErr;
  const countByModule = new Map<string, number>();
  for (const l of (lessons ?? []) as { module_id: string }[]) {
    countByModule.set(l.module_id, (countByModule.get(l.module_id) ?? 0) + 1);
  }

  return mods.map((m) => ({
    moduleId: m.slug,
    title: m.title,
    description: m.description ?? "",
    thumbnailGradient: m.thumbnail_gradient ?? "",
    coverImage: m.cover_image ?? null,
    unlockAfterDays: m.unlock_after_days ?? 0,
    sortOrder: m.sort_order,
    published: m.published,
    comingSoon: m.coming_soon ?? false,
    lessonCount: countByModule.get(m.id) ?? 0,
  }));
}

export async function createModule(input: {
  title: string;
  description?: string | null;
  thumbnailGradient?: string | null;
  coverImage?: string | null;
  unlockAfterDays?: number | null;
  published?: boolean;
  comingSoon?: boolean;
}): Promise<ModuleAdminRow> {
  const admin = createAdminClient();
  const courseId = await resolveCourseId(admin);
  if (!courseId) {
    throw new Error("Nenhum curso no DB. Rode o seed antes de criar seções.");
  }

  const { data: existing, error: exErr } = await admin
    .from("modules")
    .select("slug, sort_order")
    .eq("course_id", courseId);
  if (exErr) throw exErr;
  const rows = (existing ?? []) as { slug: string; sort_order: number }[];

  const slug = uniqueLessonId(
    slugifyLessonTitle(input.title),
    new Set(rows.map((r) => r.slug)),
  );
  const sortOrder =
    rows.reduce((max, r) => Math.max(max, r.sort_order ?? -1), -1) + 1;
  const published = input.published ?? true;
  const comingSoon = input.comingSoon ?? false;

  const { error } = await admin.from("modules").insert({
    course_id: courseId,
    slug,
    title: input.title,
    description: input.description ?? null,
    thumbnail_gradient: input.thumbnailGradient ?? null,
    cover_image: input.coverImage ?? null,
    unlock_after_days: input.unlockAfterDays ?? 0,
    sort_order: sortOrder,
    published,
    coming_soon: comingSoon,
  });
  if (error) throw error;

  return {
    moduleId: slug,
    title: input.title,
    description: input.description ?? "",
    thumbnailGradient: input.thumbnailGradient ?? "",
    coverImage: input.coverImage ?? null,
    unlockAfterDays: input.unlockAfterDays ?? 0,
    sortOrder,
    published,
    comingSoon,
    lessonCount: 0,
  };
}

export async function updateModule(
  moduleSlug: string,
  patch: {
    title?: string;
    description?: string | null;
    thumbnailGradient?: string | null;
    coverImage?: string | null;
    unlockAfterDays?: number | null;
    published?: boolean;
    comingSoon?: boolean;
  },
): Promise<void> {
  const admin = createAdminClient();
  const courseId = await resolveCourseId(admin);
  if (!courseId) throw new Error("Nenhum curso no DB.");

  const set: Record<string, unknown> = {};
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.thumbnailGradient !== undefined)
    set.thumbnail_gradient = patch.thumbnailGradient;
  if (patch.coverImage !== undefined) set.cover_image = patch.coverImage;
  if (patch.unlockAfterDays !== undefined)
    set.unlock_after_days = patch.unlockAfterDays;
  if (patch.published !== undefined) set.published = patch.published;
  if (patch.comingSoon !== undefined) set.coming_soon = patch.comingSoon;
  if (Object.keys(set).length === 0) return;

  const { error } = await admin
    .from("modules")
    .update(set)
    .eq("course_id", courseId)
    .eq("slug", moduleSlug);
  if (error) throw error;
}

/** Deleta a seção + suas aulas (FK on delete cascade) + views/feedback das aulas
 *  (por slug — sem FK). */
export async function deleteModule(moduleSlug: string): Promise<void> {
  const admin = createAdminClient();
  const courseId = await resolveCourseId(admin);
  if (!courseId) return;

  const { data: mods, error: mErr } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .eq("slug", moduleSlug)
    .limit(1);
  if (mErr) throw mErr;
  const moduleId = (mods?.[0] as { id: string } | undefined)?.id;
  if (!moduleId) return;

  const { data: lessons, error: lErr } = await admin
    .from("lessons")
    .select("slug")
    .eq("module_id", moduleId);
  if (lErr) throw lErr;

  for (const l of (lessons ?? []) as { slug: string }[]) {
    const match = { module_id: moduleSlug, lesson_id: l.slug };
    const { error: vErr } = await admin.from("lesson_views").delete().match(match);
    if (vErr) throw vErr;
    const { error: fErr } = await admin.from("lesson_feedback").delete().match(match);
    if (fErr) throw fErr;
  }

  const { error } = await admin.from("modules").delete().eq("id", moduleId);
  if (error) throw error;
}

export async function reorderModules(orderedSlugs: string[]): Promise<void> {
  const admin = createAdminClient();
  const courseId = await resolveCourseId(admin);
  if (!courseId) return;

  for (let i = 0; i < orderedSlugs.length; i++) {
    const { error } = await admin
      .from("modules")
      .update({ sort_order: i })
      .eq("course_id", courseId)
      .eq("slug", orderedSlugs[i]);
    if (error) throw error;
  }
}
