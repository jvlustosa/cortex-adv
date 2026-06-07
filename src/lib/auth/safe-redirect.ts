const DEFAULT_PATH = "/area-de-membros";

/**
 * Aceita apenas paths relativos internos (sem open redirect).
 */
export function safeRedirectPath(
  input: string | null | undefined,
  fallback = DEFAULT_PATH,
): string {
  if (!input) return fallback;

  const trimmed = input.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("://")) {
      return fallback;
    }
    return decoded;
  } catch {
    return fallback;
  }
}
