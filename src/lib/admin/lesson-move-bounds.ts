import { adjacentModuleId } from "@/lib/lessons/admin-grouping";
import type { LessonAdminRow } from "@/lib/lessons/types";

export function lessonMoveBounds(
  lessons: LessonAdminRow[],
  lesson: LessonAdminRow,
  dbMode: boolean,
): { canMoveUp: boolean; canMoveDown: boolean } {
  const modLessons = lessons.filter((l) => l.moduleId === lesson.moduleId);
  const idx = modLessons.findIndex((l) => l.lessonId === lesson.lessonId);
  const canMoveUp =
    idx > 0 ||
    (dbMode && adjacentModuleId(lessons, lesson.moduleId, -1) !== null);
  const canMoveDown =
    idx < modLessons.length - 1 ||
    (dbMode && adjacentModuleId(lessons, lesson.moduleId, 1) !== null);
  return { canMoveUp, canMoveDown };
}
