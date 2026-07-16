import { COURSE, type CourseLesson } from "@/data/course-content";
import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonOverrideRow } from "./types";
import { compareLessons, type Orderable } from "./ordering";

function applyOverride(
  lesson: CourseLesson,
  override?: LessonOverrideRow,
): CourseLesson & { published: boolean } {
  if (!override) {
    return { ...lesson, published: true };
  }

  return {
    ...lesson,
    title: override.title ?? lesson.title,
    duration: override.duration ?? lesson.duration,
    description: override.description ?? lesson.description,
    youtubeId: override.youtube_id ?? lesson.youtubeId,
    tella: override.tella ?? lesson.tella,
    published: override.published,
  };
}

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

export async function fetchLessonOverrides(): Promise<LessonOverrideRow[]> {
  // Sem service role real não dá pra ler lesson_overrides (RLS). Degrada para o
  // catálogo estático em silêncio, sem spam de "Invalid API key" a cada render.
  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) return [];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("lesson_overrides").select("*");
    if (error) throw error;
    return (data ?? []) as LessonOverrideRow[];
  } catch (err) {
    console.error("[lessons] fetch overrides", err);
    return [];
  }
}

/** Núcleo puro do merge (sem Supabase) — testável. */
export function mergeCourseWithOverrides(
  course: typeof COURSE,
  overrides: LessonOverrideRow[],
  options?: { includeUnpublished?: boolean },
) {
  const byKey = new Map(
    overrides.map((o) => [`${o.module_id}:${o.lesson_id}`, o]),
  );

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

export function findMergedLesson(
  course: Awaited<ReturnType<typeof getMergedCourse>>,
  moduleId: string,
  lessonId: string,
) {
  const mod = course.modules.find((m) => m.id === moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  return { module: mod, lesson };
}
