export const ADMIN_EMAIL_DOMAIN = "@chatjuridico.com.br";

export function hasAdminEmailDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN);
}
