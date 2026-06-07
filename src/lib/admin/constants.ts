/** Domínios de e-mail autorizados no painel /admin (além de admin_users). */
export const ADMIN_EMAIL_DOMAINS = [
  "@chatjuridico.com.br",
  "@escritoriovilasboas.com",
] as const;

/** Domínio principal (retrocompat). */
export const ADMIN_EMAIL_DOMAIN = ADMIN_EMAIL_DOMAINS[0];

export function hasAdminEmailDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAIL_DOMAINS.some((domain) => normalized.endsWith(domain));
}
