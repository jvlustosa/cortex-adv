import type { Course, CourseLesson, CourseModule } from "@/data/course-content";

// Mapeamento puro de linhas do DB (courses/modules/lessons) → shape de runtime
// (Course/CourseModule/CourseLesson). Sem Supabase aqui: fica testável isolado.
// As leituras (query + service role) vivem em merge-course.ts.

export type CourseRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  published: boolean;
};

export type ModuleRow = {
  slug: string;
  title: string;
  description: string | null;
  thumbnail_gradient: string | null;
  cover_image: string | null;
  unlock_after_days: number | null;
  sort_order: number;
  published: boolean;
};

export type LessonRow = {
  /** slug do módulo dono (resolvido no join da query). */
  module_slug: string;
  slug: string;
  title: string;
  duration: string | null;
  youtube_id: string | null;
  tella: string | null;
  description: string | null;
  sort_order: number;
  published: boolean;
};

export type PublishedCourseLesson = CourseLesson & { published: boolean };
export type MappedModule = CourseModule & {
  published: boolean;
  lessons: PublishedCourseLesson[];
};
export type MappedCourse = Pick<Course, "title" | "subtitle"> & {
  modules: MappedModule[];
};

function toLesson(row: LessonRow): PublishedCourseLesson {
  return {
    id: row.slug,
    title: row.title,
    duration: row.duration ?? "",
    youtubeId: row.youtube_id ?? undefined,
    tella: row.tella ?? undefined,
    description: row.description ?? "",
    published: row.published,
  };
}

function toModule(row: ModuleRow, lessons: PublishedCourseLesson[]): MappedModule {
  return {
    id: row.slug,
    title: row.title,
    description: row.description ?? "",
    thumbnailGradient: row.thumbnail_gradient ?? "",
    coverImage: row.cover_image ?? undefined,
    unlockAfterDays: row.unlock_after_days ?? undefined,
    published: row.published,
    lessons,
  };
}

/**
 * Núcleo puro do read DB-native. Ordena por sort_order, filtra publicados
 * (salvo includeUnpublished) e dropa módulo vazio — mesmo contrato de saída do
 * antigo mergeCourseWithOverrides, pra os consumidores não mudarem.
 */
export function mapDbToCourse(
  course: CourseRow,
  modules: ModuleRow[],
  lessons: LessonRow[],
  options?: { includeUnpublished?: boolean },
): MappedCourse {
  const includeUnpublished = options?.includeUnpublished ?? false;
  const title = course.title;
  const subtitle = course.subtitle ?? "";

  if (!includeUnpublished && !course.published) {
    return { title, subtitle, modules: [] };
  }

  const lessonsByModule = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const bucket = lessonsByModule.get(lesson.module_slug);
    if (bucket) bucket.push(lesson);
    else lessonsByModule.set(lesson.module_slug, [lesson]);
  }

  const mapped = [...modules]
    .filter((mod) => includeUnpublished || mod.published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((mod) => {
      const lessonRows = (lessonsByModule.get(mod.slug) ?? [])
        .filter((l) => includeUnpublished || l.published)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(toLesson);
      return toModule(mod, lessonRows);
    })
    .filter((mod) => mod.lessons.length > 0); // dropa módulo vazio (protege o player)

  return { title, subtitle, modules: mapped };
}
