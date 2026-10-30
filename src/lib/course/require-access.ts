import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin/require-admin";
import { listOwnedProducts } from "@/lib/access/entitlements";
import {
  fallbackHome,
  hasProductAccess,
  type Product,
} from "@/lib/access/products";
import { isDemoMode, isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

/** Conta logada sem nenhum produto (não deveria existir após o backfill 019). */
export const NO_ACCESS_PATH = "/sem-acesso";

/**
 * Gate SSR por produto: exige sessão e o produto comprado (o curso inclui o
 * Degravação). Sem o produto, manda para a home do que a conta tem — nunca
 * para o login, que redireciona logado de volta à área de membros (loop).
 */
export async function requireProductAccess(product: Product, nextPath: string) {
  if (isDemoMode()) {
    return { authOn: false, user: null, demoMode: true as const };
  }

  const authOn = isSupabaseEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const owned = await listOwnedProducts(supabase, user.id);
  if (!hasProductAccess(owned, product) && !(await isAdminUser(user))) {
    redirect(fallbackHome(owned) ?? NO_ACCESS_PATH);
  }

  return { authOn, user, demoMode: false as const };
}

export async function requireCourseAccess(nextPath: string) {
  return requireProductAccess("curso", nextPath);
}

/**
 * Mesmo gate para API routes (formato do assertAdminApi): 401 sem sessão, 403
 * sem o produto. Admin passa sempre. Quem chama trata demo/Supabase desligado.
 */
export async function assertProductApi(product: Product) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Não autorizado." }, { status: 401 }),
    } as const;
  }

  const owned = await listOwnedProducts(supabase, user.id);
  if (!hasProductAccess(owned, product) && !(await isAdminUser(user))) {
    return {
      error: NextResponse.json(
        { error: "Sua conta não tem acesso a este conteúdo." },
        { status: 403 },
      ),
    } as const;
  }

  return { user } as const;
}
