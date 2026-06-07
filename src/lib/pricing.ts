export const PRICING = {
  installments: { count: 12, amount: 49 },
  upfrontDiscountPercent: 40,
  guaranteeDays: 8,
} as const;

export function getPricingSummary() {
  const total =
    PRICING.installments.count * PRICING.installments.amount;
  const upfront =
    total * (1 - PRICING.upfrontDiscountPercent / 100);

  return {
    total,
    upfront,
    savings: total - upfront,
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
