import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";
import { grantProduct, type EntitlementSource } from "./entitlements";
import { PRODUCT_HOME, type Product } from "./products";

export type GrantAccessResult = {
  email: string;
  /** true se a conta foi criada agora; false se já existia (idempotente). */
  created: boolean;
  /** Link de acesso pronto, no padrão SSR do projeto (/auth/confirm). */
  magicLink: string;
};

export type GrantAccessOptions = {
  /** Vira display name (full_name) da conta nova — só aplicado na criação. */
  fullName?: string;
  /** Destino após autenticar (path interno já validado). Default: home do produto. */
  next?: string;
  /**
   * Produto comprado, gravado em product_entitlements. Omitido = só gera o
   * link (ex.: admin reenviando acesso) sem liberar produto novo.
   */
  product?: Product;
  /** Origem do direito, para auditoria. Default: grant-api. */
  source?: EntitlementSource;
};

/** Para onde o magic link leva após autenticar, quando não informado. */
const DEFAULT_NEXT_PATH = "/area-de-membros";

function isAlreadyRegistered(error: { message?: string; code?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    code === "email_exists" ||
    code === "user_already_exists" ||
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("already exists")
  );
}

/**
 * Garante uma conta de membro para o e-mail e devolve um magic link pronto.
 *
 * Idempotente: se a conta já existe, apenas gera um link novo (created: false).
 * Login do curso é passwordless, então a conta é criada sem senha, com e-mail já
 * confirmado, para poder receber/usar o magic link imediatamente.
 */
export async function grantMemberAccess(
  email: string,
  options: GrantAccessOptions = {},
): Promise<GrantAccessResult> {
  const admin = createAdminClient();
  const fullName = options.fullName?.trim() || undefined;
  const nextPath =
    options.next?.trim() ||
    (options.product ? PRODUCT_HOME[options.product] : DEFAULT_NEXT_PATH);

  // 1. Cria a conta (sem senha). Se já existe, segue idempotente.
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    // full_name espelha em public.users via trigger sync_user_from_auth.
    ...(fullName ? { user_metadata: { full_name: fullName } } : {}),
  });

  let created = true;
  if (createErr) {
    if (!isAlreadyRegistered(createErr)) {
      throw new Error(createErr.message);
    }
    created = false;
  }

  // 2. Gera o magic link para a conta (agora garantidamente existente).
  const { data, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const hashedToken = data?.properties?.hashed_token;
  if (linkErr || !hashedToken) {
    throw new Error(linkErr?.message ?? "Falha ao gerar o link de acesso.");
  }

  // 3. Libera o produto comprado antes de entregar o link: sem o direito, o
  //    gate manda o aluno para /sem-acesso no primeiro clique.
  if (options.product) {
    const userId = data.user?.id;
    if (!userId) throw new Error("Conta sem id ao liberar o produto.");
    await grantProduct(userId, options.product, options.source ?? "grant-api");
  }

  // 4. Monta o link no padrão SSR do projeto: /auth/confirm lê token_hash + type
  //    e grava a sessão em cookie. O action_link cru do Supabase NÃO serve aqui.
  const url = new URL("/auth/confirm", SITE_URL);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", nextPath);

  return { email, created, magicLink: url.toString() };
}
