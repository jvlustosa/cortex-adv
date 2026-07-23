import { COURSE } from "@/data/course-content";

type CatalogLesson = (typeof COURSE.modules)[number]["lessons"][number];

const catalogByKey = new Map<string, CatalogLesson>(
  COURSE.modules.flatMap((mod) =>
    mod.lessons.map((lesson) => [`${mod.id}:${lesson.id}`, lesson]),
  ),
);

export function isCatalogLesson(moduleSlug: string, lessonSlug: string): boolean {
  return catalogByKey.has(`${moduleSlug}:${lessonSlug}`);
}

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

/** Preenche campos vazios do DB com o catálogo estático (course.yml). */
export function fillLessonFromCatalog<
  T extends {
    title?: string | null;
    duration?: string | null;
    youtube_id?: string | null;
    youtubeId?: string | null;
    tella?: string | null;
    description?: string | null;
  },
>(moduleSlug: string, lessonSlug: string, row: T): T {
  const catalog = catalogByKey.get(`${moduleSlug}:${lessonSlug}`);
  if (!catalog) return row;

  return {
    ...row,
    title: hasText(row.title) ? row.title : catalog.title,
    duration: hasText(row.duration) ? row.duration : (catalog.duration ?? row.duration),
    tella: hasText(row.tella) ? row.tella : (catalog.tella ?? row.tella),
    youtube_id: hasText(row.youtube_id)
      ? row.youtube_id
      : (catalog.youtubeId ?? row.youtube_id),
    youtubeId: hasText(row.youtubeId)
      ? row.youtubeId
      : (catalog.youtubeId ?? row.youtubeId),
    description: hasText(row.description)
      ? row.description
      : (catalog.description ?? row.description),
  };
}
