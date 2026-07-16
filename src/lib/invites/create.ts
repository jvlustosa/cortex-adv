import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteToken } from "./generate-token";
import { buildSignupUrl } from "./signup-url";
import { normalizeInviteTitle } from "./recipient";
import type { CreateInviteInput, CreatedInvite, InviteTokenRow } from "./types";

const MAX_TOKEN_ATTEMPTS = 5;

const INVITE_COLUMNS =
  "id, token, label, max_uses, used_count, expires_at, active, created_at, recipient_name, recipient_email, recipient_title";

function normalizeExpiresAt(value: CreateInviteInput["expiresAt"]): string | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("expiresAt inválido.");
  }
  return date.toISOString();
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
}

function toCreatedInvite(row: InviteTokenRow): CreatedInvite {
  return {
    id: row.id,
    token: row.token,
    label: row.label,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    expiresAt: row.expires_at,
    active: row.active,
    createdAt: row.created_at,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    recipientTitle: row.recipient_title,
    signupUrl: buildSignupUrl(row.token),
  };
}

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" || (error.message ?? "").includes("duplicate key");
}

/**
 * Cria um convite de acesso na tabela invite_tokens (service role).
 * Gera token automaticamente se não informado; repete em caso de colisão.
 */
export async function createInviteToken(
  input: CreateInviteInput = {},
): Promise<CreatedInvite> {
  const admin = createAdminClient();
  const maxUses = input.maxUses ?? 1;

  if (!Number.isInteger(maxUses) || maxUses < 1) {
    throw new Error("maxUses deve ser um inteiro >= 1.");
  }

  const label = input.label?.trim() || null;
  const expiresAt = normalizeExpiresAt(input.expiresAt);
  const customToken = input.token?.trim();
  const recipientName = normalizeText(input.recipientName);
  const recipientEmail = normalizeEmail(input.recipientEmail);
  const recipientTitle = normalizeInviteTitle(input.recipientTitle);

  for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt++) {
    const token = customToken || generateInviteToken();

    const { data, error } = await admin
      .from("invite_tokens")
      .insert({
        token,
        label,
        max_uses: maxUses,
        expires_at: expiresAt,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_title: recipientTitle,
      })
      .select(INVITE_COLUMNS)
      .single();

    if (!error && data) {
      return toCreatedInvite(data as InviteTokenRow);
    }

    if (customToken) {
      throw new Error(error?.message ?? "Não foi possível criar o convite.");
    }

    if (!isUniqueViolation(error ?? {})) {
      throw new Error(error?.message ?? "Não foi possível criar o convite.");
    }
  }

  throw new Error("Não foi possível gerar um token único. Tente novamente.");
}
