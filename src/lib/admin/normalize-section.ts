export type SectionAdminRow = {
  moduleId: string;
  title: string;
  description: string;
  thumbnailGradient: string;
  coverImage: string | null;
  unlockAfterDays: number;
  sortOrder: number;
  published: boolean;
  comingSoon: boolean;
  lessonCount: number;
};

export function normalizeSection(
  raw: Partial<SectionAdminRow> & { slug?: string },
): SectionAdminRow {
  const moduleId = raw.moduleId ?? raw.slug ?? "";
  return {
    moduleId,
    title: raw.title ?? moduleId,
    description: raw.description ?? "",
    thumbnailGradient: raw.thumbnailGradient ?? "",
    coverImage: raw.coverImage ?? null,
    unlockAfterDays: raw.unlockAfterDays ?? 0,
    sortOrder: raw.sortOrder ?? 0,
    published: raw.published ?? true,
    comingSoon: raw.comingSoon ?? false,
    lessonCount: raw.lessonCount ?? 0,
  };
}
