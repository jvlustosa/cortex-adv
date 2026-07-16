/** Slugifica um título para lesson_id: minúsculo, sem acento, não-alfanumérico → hífen. */
export function slugifyLessonTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "aula";
}

/** Garante unicidade dentro do módulo: colisão → sufixo -2, -3… */
export function uniqueLessonId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
