/**
 * Produtos vendidos no Claude Academy. Espelha o check de
 * product_entitlements.product e invite_tokens.product (migration 019).
 */
export const PRODUCTS = ["curso", "degravacao"] as const;

export type Product = (typeof PRODUCTS)[number];

export const DEFAULT_PRODUCT: Product = "curso";

/** Para onde o aluno vai depois de entrar, por produto comprado. */
export const PRODUCT_HOME: Record<Product, string> = {
  curso: "/area-de-membros",
  degravacao: "/area-de-membros/degravacao",
};

export function isProduct(value: unknown): value is Product {
  return typeof value === "string" && (PRODUCTS as readonly string[]).includes(value);
}

/** O curso inclui o Degravação como bônus; o Degravação avulso não dá o curso. */
export function hasProductAccess(
  owned: readonly string[],
  product: Product,
): boolean {
  return owned.includes(product) || owned.includes("curso");
}

/**
 * Destino de quem caiu num produto que não comprou: a home de outro produto
 * que tenha, ou null quando a conta não tem nenhum.
 */
export function fallbackHome(owned: readonly string[]): string | null {
  const product = PRODUCTS.find((p) => hasProductAccess(owned, p));
  return product ? PRODUCT_HOME[product] : null;
}
