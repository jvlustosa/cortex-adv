/**
 * Supabase fica inativo até definir NEXT_PUBLIC_SUPABASE_ENABLED=true.
 * Em produção, sempre ativo — modo demo só existe em dev local.
 */
export function isSupabaseEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return process.env.NEXT_PUBLIC_SUPABASE_ENABLED === "true";
}

/**
 * Cadastro (/signup) em produção só com NEXT_PUBLIC_SIGNUP_ENABLED=true.
 * Em dev, segue o mesmo gating do Supabase local.
 */
export function isSignupEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "true";
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ENABLED === "true";
}
