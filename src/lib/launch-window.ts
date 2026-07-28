export type SalesMode = "cohort" | "evergreen";

/**
 * Modo de venda do curso.
 *
 * - `evergreen`: matrícula aberta o ano todo, plano anual sem desconto de
 *   lançamento. Nenhuma escassez de turma no ar (sem vagas, sem contagem
 *   regressiva, sem prazo) — nada disso seria verdade vendendo no perpétuo.
 * - `cohort`: volta a janela de datas abaixo. Pra abrir turma nova, troque a
 *   flag e atualize `LAUNCH_OPENS_AT` / `LAUNCH_CLOSES_AT` + rótulos.
 *
 * O tipo explícito é de propósito: sem ele o TS trava as comparações com o
 * outro modo.
 */
export const SALES_MODE: SalesMode = "evergreen";

/**
 * Janela de lançamento da primeira turma — fuso America/Sao_Paulo (GMT-3).
 * Abre qui 16/07/2026 19h39 (liberado mais cedo) · encerra seg 20/07/2026 23h59.
 * Só vale em `SALES_MODE === "cohort"`.
 *
 * O gate roda no cliente (ver use-launch-phase): a home abre o checkout e
 * expira sozinha no horário, sem depender de redeploy no minuto exato.
 */
export const LAUNCH_OPENS_AT = new Date("2026-07-16T19:39:00-03:00");
export const LAUNCH_CLOSES_AT = new Date("2026-07-20T23:59:59-03:00");

/** Rótulos pt-BR fixos — não dependem de Intl/fuso do navegador. */
export const LAUNCH_OPENS_LABEL = "às 19h39";
export const LAUNCH_CLOSES_LABEL = "segunda, 20/07 às 23h59";

export type LaunchPhase = "before" | "live" | "closed" | "evergreen";

export function getLaunchPhase(
  now: Date,
  mode: SalesMode = SALES_MODE,
): LaunchPhase {
  if (mode === "evergreen") return "evergreen";

  const t = now.getTime();
  if (t < LAUNCH_OPENS_AT.getTime()) return "before";
  if (t > LAUNCH_CLOSES_AT.getTime()) return "closed";
  return "live";
}

export function isCheckoutOpen(phase: LaunchPhase | null): boolean {
  return phase === "live" || phase === "evergreen";
}

/** Tempo restante até `target`: "2d 4h", "4h 12min" ou "12min". Vazio se já passou. */
export function formatRemaining(now: Date, target: Date): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "";

  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}
