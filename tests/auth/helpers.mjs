export const BASE_URL =
  process.env.AUDIT_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

/**
 * @param {string} [baseUrl]
 * @returns {Promise<boolean>}
 */
export async function isServerReachable(baseUrl = BASE_URL) {
  try {
    const res = await fetch(baseUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

/**
 * @typedef {"demo" | "auth" | "unknown"} AuthMode
 */

/**
 * @param {string} [baseUrl]
 * @returns {Promise<AuthMode>}
 */
export async function detectAuthMode(baseUrl = BASE_URL) {
  const res = await fetch(`${baseUrl}/login`);
  const html = await res.text();

  if (html.includes("Em breve") && html.includes("modo demo")) {
    return "demo";
  }

  if (
    html.includes('type="email"') ||
    html.includes("autoComplete=\"email\"") ||
    html.includes('placeholder="voce@escritorio.com.br"')
  ) {
    return "auth";
  }

  return "unknown";
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
export async function fetchApp(path, init = {}) {
  const url = `${BASE_URL.replace(/\/$/, "")}${path}`;
  return fetch(url, {
    redirect: "manual",
    ...init,
  });
}

/**
 * @param {Response} res
 * @returns {string | null}
 */
export function locationPath(res) {
  const location = res.headers.get("location");
  if (!location) return null;
  try {
    return new URL(location, BASE_URL).pathname + new URL(location, BASE_URL).search;
  } catch {
    return location;
  }
}
