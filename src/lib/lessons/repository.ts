import { COURSE } from "@/data/course-content";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminTotals,
  LessonAdminRow,
  LessonFeedbackRow,
  LessonOverrideRow,
} from "./types";
import { fetchLessonOverrides } from "./merge-course";
import { compareLessons, type Orderable } from "./ordering";

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

export async function listLessonsForAdmin(): Promise<{
  lessons: LessonAdminRow[];
  totals: AdminTotals;
}> {
  const overrides = await fetchLessonOverrides();
  const overrideMap = new Map(
    overrides.map((o) => [`${o.module_id}:${o.lesson_id}`, o]),
  );

  const [viewMap, feedbackMap] = await Promise.all([
    aggregateViews(),
    aggregateFeedback(),
  ]);

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

export async function upsertLessonOverride(input: {
  moduleId: string;
  lessonId: string;
  youtubeId?: string | null;
  tella?: string | null;
  duration?: string | null;
  title?: string | null;
  description?: string | null;
  published?: boolean;
}): Promise<LessonOverrideRow> {
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

  return rows.map((row) => {
    const mod = COURSE.modules.find((m) => m.id === row.module_id);
    const lesson = mod?.lessons.find((l) => l.id === row.lesson_id);
    return {
      ...row,
      userEmail: row.user_id ? emails.get(row.user_id) ?? null : null,
      lessonTitle: lesson?.title ?? row.lesson_id,
      moduleTitle: mod?.title ?? row.module_id,
    };
  });
}
