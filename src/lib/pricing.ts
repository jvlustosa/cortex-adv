/**
 * Valores espelham as cobranças do ASAAS — ver CHECKOUT abaixo. Mexeu aqui,
 * confere lá (e vice-versa): a página não pode anunciar um valor e o checkout
 * cobrar outro. `total` é explícito porque `count × amount` daria 2 centavos a
 * mais que a cobrança real (12 × 222,21 = 2.666,52 vs 2.666,50).
 */
export const PRICING = {
  installments: { count: 12, amount: 222.21 },
  total: 2666.5,
  upfront: 1880,
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
  /** Valor cheio, R$ 2.666,50 em até 12×. */
  installments:
    process.env.NEXT_PUBLIC_CHECKOUT_INSTALLMENTS_URL ??
    "https://www.asaas.com/c/1p6mq1pi7zlfsryz",
  /** Especial à vista, R$ 1.880. */
  upfront:
    process.env.NEXT_PUBLIC_CHECKOUT_UPFRONT_URL ??
    "https://www.asaas.com/c/dr10ovq2437wxk6q",
  /** 50% off, R$ 994. Só via /voucher — fora da página de vendas. */
  voucher:
    process.env.NEXT_PUBLIC_CHECKOUT_VOUCHER_URL ??
    "https://www.asaas.com/c/1eoleyxgdiibauoh",
  /**
   * Degravação com Claude avulso, R$ 597. Vazio até o link existir no Asaas:
   * a página de vendas cai no WhatsApp em vez de um checkout quebrado.
   */
  degravacao: process.env.NEXT_PUBLIC_CHECKOUT_DEGRAVACAO_URL ?? "",
} as const;

/** Degravação com Claude, venda avulsa. Aluno do curso já tem incluído. */
export const DEGRAVACAO_PRICING = {
  price: 597,
  guaranteeDays: PRICING.guaranteeDays,
} as const;

export function getLaunchLabel() {
  return `${LAUNCH.cohort} · ${LAUNCH.scarcity}`;
}

export function getPricingSummary() {
  const total = PRICING.total;
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
