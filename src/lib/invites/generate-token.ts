import { randomBytes } from "crypto";

const TOKEN_PREFIX = "CA-INV";

/** Gera token legível no formato CA-INV-YYYY-XXXXXX (ex.: CA-INV-2026-A3F9B2). */
export function generateInviteToken(): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${TOKEN_PREFIX}-${year}-${suffix}`;
}

export function isGeneratedInviteToken(token: string): boolean {
  return new RegExp(`^${TOKEN_PREFIX}-\\d{4}-[A-F0-9]{6}$`, "i").test(token.trim());
}
