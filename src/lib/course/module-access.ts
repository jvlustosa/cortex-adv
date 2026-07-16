const DAY_MS = 24 * 60 * 60 * 1000;

export type ModuleAccess = {
  isUnlocked: boolean;
  /** ISO da data de liberação; null quando indeterminado ou sem trava. */
  unlockAt: string | null;
};

/**
 * Libera o módulo após `unlockAfterDays` contados da matrícula (created_at do
 * usuário no Supabase). Sem trava configurada, abre na hora. Com trava mas sem
 * data confiável, trata como travado — nunca abre por omissão (regra dos packs).
 */
export function computeModuleAccess(
  enrolledAtISO: string | null | undefined,
  unlockAfterDays: number | null | undefined,
  nowMs: number = Date.now(),
): ModuleAccess {
  if (!unlockAfterDays || unlockAfterDays <= 0) {
    return { isUnlocked: true, unlockAt: null };
  }

  if (!enrolledAtISO) return { isUnlocked: false, unlockAt: null };

  const enrolledMs = Date.parse(enrolledAtISO);
  if (Number.isNaN(enrolledMs)) return { isUnlocked: false, unlockAt: null };

  const unlockMs = enrolledMs + unlockAfterDays * DAY_MS;
  return {
    isUnlocked: nowMs >= unlockMs,
    unlockAt: new Date(unlockMs).toISOString(),
  };
}
