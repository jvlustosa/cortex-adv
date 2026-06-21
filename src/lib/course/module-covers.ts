/** Capas 3:4 das temporadas (1024×1365) — ver docs/claude-academy-serie-ementas.md */
export const SEASON_COVER_WIDTH = 1024;
export const SEASON_COVER_HEIGHT = 1365;
export const SEASON_COVER_ASPECT = "3 / 4" as const;
export const SEASON_COVER_IMAGES = [
  "/assets/images/temporadas/temporada-0-comece-aqui.png",
  "/assets/images/temporadas/temporada-1-fundacao-pratica.png",
  "/assets/images/temporadas/temporada-2-economia-claude.png",
  "/assets/images/temporadas/temporada-3-projects.png",
  "/assets/images/temporadas/temporada-4-cowork.png",
  "/assets/images/temporadas/temporada-5-escritorio-automatico.png",
  "/assets/images/temporadas/temporada-6-artefatos.png",
  "/assets/images/temporadas/temporada-7-encerramento.png",
] as const;

const MODULE_COVER_BY_ID: Record<string, string> = {
  cowork: SEASON_COVER_IMAGES[4],
  automacao: SEASON_COVER_IMAGES[5],
  etica: SEASON_COVER_IMAGES[2],
};

export function getModuleCoverImage(
  moduleId: string,
  seasonIndex: number,
  explicit?: string,
): string {
  if (explicit) return explicit;
  return (
    MODULE_COVER_BY_ID[moduleId] ??
    SEASON_COVER_IMAGES[seasonIndex % SEASON_COVER_IMAGES.length]
  );
}
