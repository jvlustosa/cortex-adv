import type { Course, CourseLesson, CourseModule } from "@/data/course-content";
import { getModuleCoverImage } from "@/lib/course/module-covers";

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
  /** true = módulo "em breve" (card travado nos membros). Ausente = false. */
  coming_soon?: boolean | null;
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
  comingSoon?: boolean;
  lessons: PublishedCourseLesson[];
};

/** Card "em breve" — mesmo shape do fallback de roteiro (coming-soon.ts). */
export type ComingSoonModuleView = {
  id: string;
  title: string;
  teaser: string;
  coverImage: string;
  seasonNumber: number;
};

export type MappedCourse = Pick<Course, "title" | "subtitle"> & {
  modules: MappedModule[];
  /** Módulos marcados "em breve" no DB. Vazio → o grid cai no roteiro. */
  comingSoonModules?: ComingSoonModuleView[];
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
    comingSoon: row.coming_soon ?? false,
    lessons,
  };
}

function toComingSoonView(row: ModuleRow): ComingSoonModuleView {
  return {
    id: `em-breve-${row.slug}`,
    title: row.title,
    teaser: row.description ?? "",
    coverImage: getModuleCoverImage(
      row.slug,
      row.sort_order,
      row.cover_image ?? undefined,
    ),
    seasonNumber: row.sort_order,
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
    return { title, subtitle, modules: [], comingSoonModules: [] };
  }

  const lessonsByModule = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const bucket = lessonsByModule.get(lesson.module_slug);
    if (bucket) bucket.push(lesson);
    else lessonsByModule.set(lesson.module_slug, [lesson]);
  }

  const liveModules: MappedModule[] = [];
  const comingSoonModules: ComingSoonModuleView[] = [];

  const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);

  for (const mod of sorted) {
    // coming_soon explícito aparece mesmo despublicado; o resto respeita published.
    if (
      !includeUnpublished &&
      !mod.published &&
      mod.coming_soon !== true
    ) {
      continue;
    }

    const lessonRows = (lessonsByModule.get(mod.slug) ?? [])
      .filter((l) => includeUnpublished || l.published)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toLesson);

    if (mod.coming_soon === true || lessonRows.length === 0) {
      comingSoonModules.push(toComingSoonView(mod));
      continue;
    }

    liveModules.push(toModule(mod, lessonRows));
  }

  return { title, subtitle, modules: liveModules, comingSoonModules };
}
