export const PRICING = {
  installments: { count: 12, amount: 138 },
  upfront: 994,
  guaranteeDays: 8,
} as const;

export const LAUNCH = {
  spots: 20,
  cohort: "Primeira turma",
  scarcity: "Apenas 20 vagas",
} as const;

/**
 * Links de checkout (ASAAS). São páginas de pagamento públicas — ficam no
 * código pra funcionar já no deploy, sem depender de env na Vercel. Dá pra
 * sobrescrever por env (NEXT_PUBLIC_CHECKOUT_*) sem mexer no código.
 * A liberação por horário fica no gate de lançamento (ver launch-window).
 */
export const CHECKOUT = {
  installments:
    process.env.NEXT_PUBLIC_CHECKOUT_INSTALLMENTS_URL ??
    "https://www.asaas.com/c/s8toxiqpsd8xs66h",
  upfront:
    process.env.NEXT_PUBLIC_CHECKOUT_UPFRONT_URL ??
    "https://www.asaas.com/c/pbwfl1hwekzmyz0s",
} as const;

export function getLaunchLabel() {
  return `${LAUNCH.cohort} · ${LAUNCH.scarcity}`;
}

export function getPricingSummary() {
  const total =
    PRICING.installments.count * PRICING.installments.amount;
  const upfront = PRICING.upfront;
  const savings = total - upfront;

  return {
    total,
    upfront,
    savings,
    upfrontDiscountPercent: Math.round((savings / total) * 100),
  };
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
