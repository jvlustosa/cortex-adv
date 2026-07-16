import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMergedCourse } from "@/lib/lessons/merge-course";

export type CourseProgress = {
  totalLessons: number;
  viewedLessons: number;
  progressPercent: number;
  isComplete: boolean;
  /** Chaves "module_id:lesson_id" das aulas concluídas pelo usuário. */
  completedKeys: string[];
};

async function countPublishedLessons(): Promise<number> {
  const course = await getMergedCourse(); // já filtra publicadas + inclui custom
  return course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
}

export async function getUserCourseProgress(
  userId: string | null | undefined,
): Promise<CourseProgress> {
  const totalLessons = await countPublishedLessons();

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
    uniqueLessons.add(`${row.module_id}:${row.lesson_id}`);
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
