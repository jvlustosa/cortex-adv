/**
 * Supabase fica inativo até definir NEXT_PUBLIC_SUPABASE_ENABLED=true
 * e as variáveis do Supabase no ambiente.
 */
export function isSupabaseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_ENABLED === "true";
}
