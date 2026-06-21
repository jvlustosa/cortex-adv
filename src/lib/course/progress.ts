import { COURSE } from "@/data/course-content";
import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLessonOverrides } from "@/lib/lessons/merge-course";

export type CourseProgress = {
  totalLessons: number;
  viewedLessons: number;
  progressPercent: number;
  isComplete: boolean;
};

async function countPublishedLessons(): Promise<number> {
  const overrides = await fetchLessonOverrides();
  const unpublished = new Set(
    overrides.filter((o) => !o.published).map((o) => `${o.module_id}:${o.lesson_id}`),
  );

  return COURSE.modules.reduce(
    (sum, mod) =>
      sum +
      mod.lessons.filter((lesson) => !unpublished.has(`${mod.id}:${lesson.id}`)).length,
    0,
  );
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
  };
}
