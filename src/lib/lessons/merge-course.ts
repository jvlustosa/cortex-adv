import {
  COURSE,
  type CourseLesson,
  type CourseModule,
} from "@/data/course-content";
import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonOverrideRow } from "./types";

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
    published: override.published,
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

export async function getMergedCourse(options?: { includeUnpublished?: boolean }) {
  const overrides = await fetchLessonOverrides();
  const byKey = new Map(
    overrides.map((o) => [`${o.module_id}:${o.lesson_id}`, o]),
  );

  const modules: (CourseModule & {
    lessons: (CourseLesson & { published: boolean })[];
  })[] = COURSE.modules.map((mod) => ({
    ...mod,
    lessons: mod.lessons
      .map((lesson) =>
        applyOverride(lesson, byKey.get(`${mod.id}:${lesson.id}`)),
      )
      .filter((lesson) => options?.includeUnpublished || lesson.published),
  }));

  return {
    title: COURSE.title,
    subtitle: COURSE.subtitle,
    modules,
  };
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
