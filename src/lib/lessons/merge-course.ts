import { COURSE, type CourseLesson } from "@/data/course-content";
import {
  isDbCourseSource,
  isServiceRoleConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonOverrideRow } from "./types";
import { compareLessons, type Orderable } from "./ordering";
import {
  mapDbToCourse,
  type LessonRow,
  type MappedCourse,
  type ModuleRow,
} from "./db-course";

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
): MappedCourse {
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

      // published no módulo: catálogo estático é sempre exibido (true) — mantém
      // o mesmo shape do read DB-native (MappedModule).
      return { ...mod, published: true, lessons };
    })
    .filter((mod) => mod.lessons.length > 0); // dropa módulo vazio (protege o player)

  // Modo YAML: comingSoonModules ausente → o grid cai no roteiro (coming-soon.ts).
  return {
    title: course.title,
    subtitle: course.subtitle,
    modules,
  };
}

/**
 * Lê o curso das tabelas nativas (courses/modules/lessons) via service role.
 * Retorna null (→ degrada pro catálogo estático) se: Supabase/serviço off,
 * erro, ou DB ainda não semeado (sem curso/módulos). Cutover controlado por
 * COURSE_SOURCE=db (ver isDbCourseSource).
 */
export async function fetchDbCourse(options?: {
  includeUnpublished?: boolean;
}): Promise<MappedCourse | null> {
  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) return null;

  try {
    const admin = createAdminClient();

    const { data: courses, error: cErr } = await admin
      .from("courses")
      .select("id, slug, title, subtitle, published")
      .order("sort_order", { ascending: true })
      .limit(1);
    if (cErr) throw cErr;
    const course = courses?.[0];
    if (!course) return null; // pré-seed: nenhum curso → degrada

    const { data: modules, error: mErr } = await admin
      .from("modules")
      .select(
        "id, slug, title, description, thumbnail_gradient, cover_image, unlock_after_days, sort_order, published, coming_soon",
      )
      .eq("course_id", course.id);
    if (mErr) throw mErr;
    if (!modules || modules.length === 0) return null; // sem módulos → degrada

    const moduleSlugById = new Map<string, string>(
      modules.map((m) => [m.id as string, m.slug as string]),
    );

    const { data: lessons, error: lErr } = await admin
      .from("lessons")
      .select(
        "module_id, slug, title, duration, youtube_id, tella, description, sort_order, published",
      )
      .in(
        "module_id",
        modules.map((m) => m.id),
      );
    if (lErr) throw lErr;

    const lessonRows: LessonRow[] = (lessons ?? []).map((l) => ({
      module_slug: moduleSlugById.get(l.module_id as string) ?? "",
      slug: l.slug as string,
      title: l.title as string,
      duration: l.duration as string | null,
      youtube_id: l.youtube_id as string | null,
      tella: l.tella as string | null,
      description: l.description as string | null,
      sort_order: l.sort_order as number,
      published: l.published as boolean,
    }));

    const moduleRows: ModuleRow[] = modules.map((m) => ({
      slug: m.slug as string,
      title: m.title as string,
      description: m.description as string | null,
      thumbnail_gradient: m.thumbnail_gradient as string | null,
      cover_image: m.cover_image as string | null,
      unlock_after_days: m.unlock_after_days as number | null,
      sort_order: m.sort_order as number,
      published: m.published as boolean,
      coming_soon: m.coming_soon as boolean | null,
    }));

    return mapDbToCourse(
      {
        slug: course.slug as string,
        title: course.title as string,
        subtitle: course.subtitle as string | null,
        published: course.published as boolean,
      },
      moduleRows,
      lessonRows,
      options,
    );
  } catch (err) {
    console.error("[lessons] fetch db course", err);
    return null; // erro → degrada pro catálogo estático (não quebra o app)
  }
}

export async function getMergedCourse(options?: {
  includeUnpublished?: boolean;
}): Promise<MappedCourse> {
  if (isDbCourseSource()) {
    const dbCourse = await fetchDbCourse(options);
    if (dbCourse) return dbCourse;
    // flag ligada mas DB indisponível/vazio → degrada em vez de quebrar.
  }

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
