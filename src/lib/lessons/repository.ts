import { COURSE } from "@/data/course-content";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDbCourseSource } from "@/lib/supabase/enabled";
import type {
  AdminTotals,
  LessonAdminRow,
  LessonFeedbackItem,
  LessonFeedbackRow,
  LessonOverrideRow,
} from "./types";
import { fetchLessonOverrides, getMergedCourse } from "./merge-course";
import { compareLessons, nextOrderIndex, type Orderable } from "./ordering";
import { slugifyLessonTitle, uniqueLessonId } from "./slug";
import {
  adminContentFromDb,
  createLessonDb,
  deleteLessonDb,
  reorderModuleDb,
  setPublishedBatchDb,
  updateLessonDb,
  type AdminContentLesson,
  type AdminContentModule,
} from "./repository-db";

export class CatalogLessonError extends Error {}

type ViewAgg = { module_id: string; lesson_id: string; count: number };
type FeedbackAgg = {
  module_id: string;
  lesson_id: string;
  count: number;
  avg: number;
};

async function aggregateViews(): Promise<Map<string, number>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("lesson_views").select("module_id, lesson_id");
  if (error) throw error;

  const map = new Map<string, number>();
  for (const row of (data ?? []) as ViewAgg[]) {
    const key = `${row.module_id}:${row.lesson_id}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

async function aggregateFeedback(): Promise<Map<string, FeedbackAgg>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_feedback")
    .select("module_id, lesson_id, rating");
  if (error) throw error;

  const map = new Map<string, { sum: number; count: number }>();
  for (const row of (data ?? []) as { module_id: string; lesson_id: string; rating: number }[]) {
    const key = `${row.module_id}:${row.lesson_id}`;
    const prev = map.get(key) ?? { sum: 0, count: 0 };
    map.set(key, { sum: prev.sum + row.rating, count: prev.count + 1 });
  }

  const result = new Map<string, FeedbackAgg>();
  for (const [key, { sum, count }] of map) {
    const [module_id, lesson_id] = key.split(":");
    result.set(key, {
      module_id,
      lesson_id,
      count,
      avg: sum / count,
    });
  }
  return result;
}

/** Conteúdo p/ o painel a partir do catálogo estático + overlay (modo legado). */
function adminContentFromCatalog(
  overrides: LessonOverrideRow[],
): AdminContentModule[] {
  const overrideMap = new Map(
    overrides.map((o) => [`${o.module_id}:${o.lesson_id}`, o]),
  );

  return COURSE.modules.map((mod) => {
    const rows: { lesson: AdminContentLesson; order: Orderable }[] = [];

    mod.lessons.forEach((lesson, catalogIndex) => {
      const o = overrideMap.get(`${mod.id}:${lesson.id}`);
      rows.push({
        lesson: {
          lessonId: lesson.id,
          title: o?.title ?? lesson.title,
          duration: o?.duration ?? lesson.duration,
          description: o?.description ?? lesson.description,
          youtubeId: o?.youtube_id ?? lesson.youtubeId ?? null,
          tella: o?.tella ?? lesson.tella ?? null,
          published: o?.published ?? true,
          orderIndex: o?.order_index ?? null,
          origin: "catalog",
          catalogIndex,
        },
        order: { orderIndex: o?.order_index ?? null, catalogIndex, title: lesson.title },
      });
    });

    for (const o of overrides) {
      if (o.module_id !== mod.id) continue;
      if (mod.lessons.some((l) => l.id === o.lesson_id)) continue;
      rows.push({
        lesson: {
          lessonId: o.lesson_id,
          title: o.title ?? o.lesson_id,
          duration: o.duration ?? "",
          description: o.description ?? "",
          youtubeId: o.youtube_id ?? null,
          tella: o.tella ?? null,
          published: o.published,
          orderIndex: o.order_index,
          origin: "custom",
          catalogIndex: null,
        },
        order: { orderIndex: o.order_index, catalogIndex: null, title: o.title ?? o.lesson_id },
      });
    }

    rows.sort((a, b) => compareLessons(a.order, b.order));
    return {
      moduleId: mod.id,
      moduleTitle: mod.title,
      lessons: rows.map((r) => r.lesson),
    };
  });
}

/** Junta o conteúdo (já ordenado) com views/feedback e calcula os totais. */
function assembleAdminRows(
  content: AdminContentModule[],
  viewMap: Map<string, number>,
  feedbackMap: Map<string, FeedbackAgg>,
): { lessons: LessonAdminRow[]; totals: AdminTotals } {
  const lessons: LessonAdminRow[] = [];
  for (const mod of content) {
    for (const l of mod.lessons) {
      const key = `${mod.moduleId}:${l.lessonId}`;
      const feedback = feedbackMap.get(key);
      lessons.push({
        moduleId: mod.moduleId,
        moduleTitle: mod.moduleTitle,
        lessonId: l.lessonId,
        title: l.title,
        duration: l.duration,
        description: l.description,
        youtubeId: l.youtubeId,
        tella: l.tella,
        published: l.published,
        viewCount: viewMap.get(key) ?? 0,
        feedbackCount: feedback?.count ?? 0,
        avgRating: feedback ? Math.round(feedback.avg * 10) / 10 : null,
        orderIndex: l.orderIndex,
        origin: l.origin,
      });
    }
  }

  let totalViews = 0;
  let totalFeedbacks = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  for (const l of lessons) {
    totalViews += l.viewCount;
    totalFeedbacks += l.feedbackCount;
    if (l.avgRating !== null && l.feedbackCount > 0) {
      ratingSum += l.avgRating * l.feedbackCount;
      ratingCount += l.feedbackCount;
    }
  }

  return {
    lessons,
    totals: {
      views: totalViews,
      feedbacks: totalFeedbacks,
      avgRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    },
  };
}

export async function listLessonsForAdmin(): Promise<{
  lessons: LessonAdminRow[];
  totals: AdminTotals;
}> {
  const contentPromise = isDbCourseSource()
    ? adminContentFromDb()
    : fetchLessonOverrides().then(adminContentFromCatalog);

  const [content, viewMap, feedbackMap] = await Promise.all([
    contentPromise,
    aggregateViews(),
    aggregateFeedback(),
  ]);

  return assembleAdminRows(content, viewMap, feedbackMap);
}

export async function upsertLessonOverride(input: {
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
  if (isDbCourseSource()) return updateLessonDb(input);

  const admin = createAdminClient();
  const payload: Partial<LessonOverrideRow> & {
    module_id: string;
    lesson_id: string;
    updated_at: string;
  } = {
    module_id: input.moduleId,
    lesson_id: input.lessonId,
    updated_at: new Date().toISOString(),
  };

  if (input.youtubeId !== undefined) payload.youtube_id = input.youtubeId;
  if (input.tella !== undefined) payload.tella = input.tella;
  if (input.duration !== undefined) payload.duration = input.duration;
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description;
  if (input.published !== undefined) payload.published = input.published;
  if (input.orderIndex !== undefined) payload.order_index = input.orderIndex;

  const { data, error } = await admin
    .from("lesson_overrides")
    .upsert(payload, { onConflict: "module_id,lesson_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as LessonOverrideRow;
}

/** Conjunto de aulas concluídas do usuário ("module_id:lesson_id"). */
export async function getCompletedLessonKeys(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_views")
    .select("module_id, lesson_id")
    .eq("user_id", userId);
  if (error) throw error;

  const keys = new Set<string>();
  for (const row of (data ?? []) as { module_id: string; lesson_id: string }[]) {
    keys.add(`${row.module_id}:${row.lesson_id}`);
  }
  return Array.from(keys);
}

/** Marca a aula como concluída (idempotente: não duplica se já existir). */
export async function recordLessonCompletion(input: {
  moduleId: string;
  lessonId: string;
  userId: string;
}) {
  const admin = createAdminClient();
  const { data: existing, error: selectError } = await admin
    .from("lesson_views")
    .select("id")
    .eq("user_id", input.userId)
    .eq("module_id", input.moduleId)
    .eq("lesson_id", input.lessonId)
    .limit(1);
  if (selectError) throw selectError;
  if (existing && existing.length > 0) return;

  const { error } = await admin.from("lesson_views").insert({
    module_id: input.moduleId,
    lesson_id: input.lessonId,
    user_id: input.userId,
  });
  if (error) throw error;
}

/** Desfaz a conclusão da aula. */
export async function removeLessonCompletion(input: {
  moduleId: string;
  lessonId: string;
  userId: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("lesson_views")
    .delete()
    .eq("user_id", input.userId)
    .eq("module_id", input.moduleId)
    .eq("lesson_id", input.lessonId);
  if (error) throw error;
}

export async function upsertLessonFeedback(input: {
  moduleId: string;
  lessonId: string;
  userId: string;
  rating: number;
  comment?: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_feedback")
    .upsert(
      {
        module_id: input.moduleId,
        lesson_id: input.lessonId,
        user_id: input.userId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
      { onConflict: "user_id,module_id,lesson_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as LessonFeedbackRow;
}

export async function listRecentFeedback(limit = 50): Promise<
  (LessonFeedbackRow & { userEmail?: string | null; lessonTitle: string; moduleTitle: string })[]
> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_feedback")
    .select("*")
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

  const course = await getMergedCourse({ includeUnpublished: true });
  return rows.map((row) => {
    const mod = course.modules.find((m) => m.id === row.module_id);
    const lesson = mod?.lessons.find((l) => l.id === row.lesson_id);
    return {
      ...row,
      userEmail: row.user_id ? emails.get(row.user_id) ?? null : null,
      lessonTitle: lesson?.title ?? row.lesson_id,
      moduleTitle: mod?.title ?? row.module_id,
    };
  });
}

export async function createLesson(input: {
  moduleId: string;
  title: string;
  tella?: string | null;
  youtubeId?: string | null;
  duration?: string | null;
  description?: string | null;
  published: boolean;
}): Promise<LessonAdminRow> {
  if (isDbCourseSource()) return createLessonDb(input);

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

export async function reorderModule(moduleId: string, lessonIds: string[]): Promise<void> {
  if (isDbCourseSource()) return reorderModuleDb(moduleId, lessonIds);

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const rows = lessonIds.map((lesson_id, i) => ({
    module_id: moduleId,
    lesson_id,
    order_index: i,
    updated_at: now,
  }));
  // ON CONFLICT DO UPDATE SET order_index, updated_at — published/title/tella intactos.
  const { error } = await admin
    .from("lesson_overrides")
    .upsert(rows, { onConflict: "module_id,lesson_id" });
  if (error) throw error;
}

export async function setPublishedBatch(
  keys: { moduleId: string; lessonId: string }[],
  published: boolean,
): Promise<void> {
  if (isDbCourseSource()) return setPublishedBatchDb(keys, published);

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const rows = keys.map((k) => ({
    module_id: k.moduleId,
    lesson_id: k.lessonId,
    published,
    updated_at: now,
  }));
  const { error } = await admin
    .from("lesson_overrides")
    .upsert(rows, { onConflict: "module_id,lesson_id" });
  if (error) throw error;
}

export async function deleteCustomLesson(moduleId: string, lessonId: string): Promise<void> {
  if (isDbCourseSource()) return deleteLessonDb(moduleId, lessonId);

  const mod = COURSE.modules.find((m) => m.id === moduleId);
  if (mod?.lessons.some((l) => l.id === lessonId)) {
    throw new CatalogLessonError("Aula de catálogo não pode ser removida pelo painel.");
  }
  const admin = createAdminClient();
  const match = { module_id: moduleId, lesson_id: lessonId };
  const { error: viewsErr } = await admin.from("lesson_views").delete().match(match);
  if (viewsErr) throw viewsErr;
  const { error: feedbackErr } = await admin.from("lesson_feedback").delete().match(match);
  if (feedbackErr) throw feedbackErr;
  const { error } = await admin.from("lesson_overrides").delete().match(match);
  if (error) throw error;
}

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
