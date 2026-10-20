import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "./products";

export type EntitlementSource = "invite" | "grant-api" | "admin";

/**
 * Produtos da conta. Com a sessão do aluno, a RLS só devolve as linhas dele.
 * Lança em erro de banco: o gate não pode tratar falha como "sem produto"
 * (mandaria membro pagante pra fora) nem como "tem tudo".
 */
export async function listOwnedProducts(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_entitlements")
    .select("product")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Falha ao ler produtos da conta: ${error.message}`);
  }
  return (data ?? []).map((row: { product: string }) => row.product);
}

/** Registra a compra de um produto (service role). Idempotente. */
export async function grantProduct(
  userId: string,
  product: Product,
  source: EntitlementSource,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("product_entitlements")
    .upsert(
      { user_id: userId, product, source },
      { onConflict: "user_id,product", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(`Falha ao liberar o produto: ${error.message}`);
  }
}
