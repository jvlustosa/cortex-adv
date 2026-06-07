import { SITE_URL } from "@/lib/site";
import { safeRedirectPath } from "./safe-redirect";

export const PASSWORD_RESET_PATH = "/auth/atualizar-senha";
export const PASSWORD_RECOVERY_PAGE = "/recuperar-senha";

export function passwordResetRedirectUrl(nextPath?: string | null): string {
  const next = safeRedirectPath(nextPath, PASSWORD_RESET_PATH);
  const callback = new URL("/auth/callback", SITE_URL);
  callback.searchParams.set("next", next);
  return callback.toString();
}

export const MIN_PASSWORD_LENGTH = 8;

export function validateNewPassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}
