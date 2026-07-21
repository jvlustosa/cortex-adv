import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMergedCourse } from "@/lib/lessons/merge-course";

export type CourseProgress = {
  totalLessons: number;
  viewedLessons: number;
  progressPercent: number;
  isComplete: boolean;
  /** Chaves "module_id:lesson_id" das aulas concluídas (só as ainda publicadas). */
  completedKeys: string[];
};

export type NextLessonTarget = {
  moduleId: string;
  lessonId: string;
  moduleTitle: string;
  lessonTitle: string;
  href: string;
};

type CourseCatalog = {
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string }[];
  }[];
};

function publishedKeys(course: CourseCatalog): Set<string> {
  const keys = new Set<string>();
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      keys.add(`${mod.id}:${lesson.id}`);
    }
  }
  return keys;
}

/**
 * Primeira aula ainda não concluída (ordem do catálogo).
 * Se tudo concluído, null.
 */
export function findNextLesson(
  course: CourseCatalog,
  completedKeys: Iterable<string>,
): NextLessonTarget | null {
  const done = new Set(completedKeys);
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const key = `${mod.id}:${lesson.id}`;
      if (!done.has(key)) {
        return {
          moduleId: mod.id,
          lessonId: lesson.id,
          moduleTitle: mod.title,
          lessonTitle: lesson.title,
          href: `/aulas/${mod.id}/${lesson.id}`,
        };
      }
    }
  }
  return null;
}

export async function getUserCourseProgress(
  userId: string | null | undefined,
): Promise<CourseProgress> {
  const course = await getMergedCourse();
  const catalogKeys = publishedKeys(course);
  const totalLessons = catalogKeys.size;

  if (
    !userId ||
    !isSupabaseEnabled() ||
    !isServiceRoleConfigured() ||
    totalLessons === 0
  ) {
    return {
      totalLessons,
      viewedLessons: 0,
      progressPercent: 0,
      isComplete: false,
      completedKeys: [],
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_views")
    .select("module_id, lesson_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[course/progress]", error.message);
    return {
      totalLessons,
      viewedLessons: 0,
      progressPercent: 0,
      isComplete: false,
      completedKeys: [],
    };
  }

  const uniqueLessons = new Set<string>();
  for (const row of data ?? []) {
    const key = `${row.module_id}:${row.lesson_id}`;
    if (catalogKeys.has(key)) uniqueLessons.add(key);
  }

  const viewedLessons = uniqueLessons.size;
  const progressPercent = Math.round((viewedLessons / totalLessons) * 100);

  return {
    totalLessons,
    viewedLessons,
    progressPercent,
    isComplete: viewedLessons >= totalLessons,
    completedKeys: Array.from(uniqueLessons),
  };
}
