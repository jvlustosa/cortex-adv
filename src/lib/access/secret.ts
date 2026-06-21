import { createHash, timingSafeEqual } from "crypto";

/**
 * Lê o secret de acesso da requisição. Aceita `Authorization: Bearer <secret>`
 * ou `x-api-key: <secret>` — o sistema chamador escolhe o que for mais simples.
 */
function extractProvidedSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (match) return match[1].trim();
  }
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) return apiKey.trim();
  return null;
}

/**
 * Compara via sha256 + timingSafeEqual: buffers sempre de 32 bytes (sem vazar
 * tamanho) e tempo constante (sem vazar quantos caracteres batem).
 */
function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export type GrantSecretCheck =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Valida o secret estático (ACCESS_GRANT_SECRET) da chamada máquina-a-máquina.
 * Sem a env definida o endpoint fica fechado (503) — nunca abre por omissão.
 */
export function verifyGrantSecret(request: Request): GrantSecretCheck {
  const expected = process.env.ACCESS_GRANT_SECRET;
  if (!expected) {
    return { ok: false, status: 503, error: "Endpoint não configurado." };
  }

  const provided = extractProvidedSecret(request);
  if (!provided || !secretsMatch(provided, expected)) {
    return { ok: false, status: 401, error: "Não autorizado." };
  }

  return { ok: true };
}
