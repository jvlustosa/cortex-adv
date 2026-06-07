export const PRICING = {
  installments: { count: 12, amount: 69 },
  upfront: 497,
  guaranteeDays: 8,
} as const;

export const LAUNCH = {
  spots: 20,
  cohort: "Primeira turma",
  scarcity: "Apenas 20 vagas",
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
