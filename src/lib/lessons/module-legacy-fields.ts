/** Campos legados (schema 003) exigidos por alguns bancos ainda sem migration 014. */
export function moduleLegacyLevelFields(
  sortOrder: number,
  comingSoon: boolean,
): { level_key: string; level_num: number | null } {
  return {
    level_key: comingSoon ? "bonus" : String(sortOrder),
    level_num: comingSoon ? null : sortOrder,
  };
}
