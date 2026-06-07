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
 * Cadastro (/signup) em produção só com NEXT_PUBLIC_SIGNUP_ENABLED=true.
 * Em dev, segue o mesmo gating do Supabase local.
 */
export function isSignupEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "true";
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ENABLED === "true";
}
