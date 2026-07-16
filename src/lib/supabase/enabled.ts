const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function hostnameFromSiteUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Site configurado para localhost (dev local).
 * Client: usa window.location quando NEXT_PUBLIC_SITE_URL não está definido.
 */
export function isLocalhostSite(): boolean {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    const host = hostnameFromSiteUrl(configured);
    return host !== null && LOCAL_HOSTS.has(host);
  }

  if (typeof window !== "undefined") {
    return LOCAL_HOSTS.has(window.location.hostname);
  }

  return process.env.NODE_ENV !== "production";
}

/**
 * Modo demo: curso sem login. Somente localhost com Supabase desligado.
 * Nunca em produção, preview ou staging.
 */
export function isDemoMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (isSupabaseEnabled()) return false;
  return isLocalhostSite();
}

/**
 * Supabase fica inativo até definir NEXT_PUBLIC_SUPABASE_ENABLED=true.
 * Em produção, sempre ativo; modo demo só existe em localhost (isDemoMode).
 */
export function isSupabaseEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return process.env.NEXT_PUBLIC_SUPABASE_ENABLED === "true";
}

/**
 * Credenciais reais do Supabase presentes (não placeholder).
 * Auth (login/cadastro/recuperação) depende disso — sem isso, o fetch ao
 * Supabase falha no DNS e parece "erro de internet". Use para falhar cedo
 * com mensagem honesta em vez de disparar uma requisição fadada a quebrar.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return false;
  if (url.includes("placeholder")) return false;
  if (!/^https:\/\//.test(url)) return false;
  return true;
}

/**
 * Service role (server) configurado com chave REAL — necessário para o admin
 * client (overrides de aula, progresso, signup, painel /admin). Sem isso, as
 * leituras retornam "Invalid API key"; melhor pular e degradar em silêncio.
 * Aceita a secret key nova (sb_secret_) ou um service_role JWT legado real
 * (~210+ chars); o placeholder do repo é um JWT falso curto, então é rejeitado.
 */
export function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!key || key.includes("placeholder")) return false;
  if (key.startsWith("sb_secret_")) return true;
  return key.startsWith("eyJ") && key.length >= 200;
}
