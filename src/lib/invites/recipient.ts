import { createAdminClient } from "@/lib/supabase/admin";
import type { InviteTitle } from "./types";

export type InviteRecipient = {
  name: string | null;
  email: string | null;
  title: InviteTitle | null;
};

/**
 * Valida o título honorífico do convite. Aceita 'dr' | 'dra' | vazio;
 * qualquer outro valor é erro (evita gravar lixo na coluna com check).
 */
export function normalizeInviteTitle(
  value: string | null | undefined,
): InviteTitle | null {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "") return null;
  if (normalized === "dr" || normalized === "dra") return normalized;
  throw new Error("Título inválido (use 'dr', 'dra' ou vazio).");
}

/**
 * Monta a saudação personalizada do /signup a partir do convite.
 * Concorda o gênero com o título quando ele existe; sem nome, retorna null
 * (a página cai no cabeçalho genérico).
 */
export function buildInviteGreeting(
  recipient: Pick<InviteRecipient, "name" | "title"> | null,
): string | null {
  const name = recipient?.name?.trim();
  if (!name) return null;

  if (recipient?.title === "dra") return `Seja bem-vinda, Dra. ${name}`;
  if (recipient?.title === "dr") return `Seja bem-vindo, Dr. ${name}`;
  return `Seja bem-vindo(a), ${name}`;
}

/**
 * Busca os dados do convidado pelo token (service role — a tabela não tem
 * policies para anon). Usado no server component do /signup para saudar e
 * pré-preencher o e-mail. Retorna null quando o token não existe.
 */
export async function getInviteRecipientByToken(
  token: string,
): Promise<InviteRecipient | null> {
  const normalized = token.trim();
  if (!normalized) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_tokens")
    .select("recipient_name, recipient_email, recipient_title")
    .eq("token", normalized)
    .maybeSingle();

  if (error) {
    console.error("[invites/recipient] getInviteRecipientByToken", error);
    return null;
  }
  if (!data) return null;

  return {
    name: data.recipient_name ?? null,
    email: data.recipient_email ?? null,
    title: (data.recipient_title as InviteTitle | null) ?? null,
  };
}
