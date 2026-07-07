import { PRICING } from "@/lib/pricing";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PackAccess = {
  isUnlocked: boolean;
  /** ISO da data de liberação; null quando indeterminado. */
  unlockAt: string | null;
};

/**
 * Os packs liberam após o período de garantia, contado da matrícula
 * (created_at do usuário no Supabase). Sem data confiável, trata como
 * bloqueado — nunca abre por omissão.
 */
export function computePackAccess(
  enrolledAtISO: string | null | undefined,
  nowMs: number = Date.now(),
  guaranteeDays: number = PRICING.guaranteeDays,
): PackAccess {
  if (!enrolledAtISO) return { isUnlocked: false, unlockAt: null };

  const enrolledMs = Date.parse(enrolledAtISO);
  if (Number.isNaN(enrolledMs)) return { isUnlocked: false, unlockAt: null };

  const unlockMs = enrolledMs + guaranteeDays * DAY_MS;
  return {
    isUnlocked: nowMs >= unlockMs,
    unlockAt: new Date(unlockMs).toISOString(),
  };
}

/** Data de liberação formatada em pt-BR (ex.: 14/07/2026). */
export function formatUnlockDate(unlockAtISO: string | null): string | null {
  if (!unlockAtISO) return null;
  const ms = Date.parse(unlockAtISO);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
