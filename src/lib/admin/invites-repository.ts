import { createAdminClient } from "@/lib/supabase/admin";
import { createInviteToken } from "@/lib/invites/create";
import { buildSignupUrl } from "@/lib/invites/signup-url";
import type { CreateInviteInput, CreatedInvite, InviteTokenRow } from "@/lib/invites/types";

export type InviteAdminRow = {
  id: string;
  token: string;
  label: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  signupUrl: string;
};

function toInviteRow(row: InviteTokenRow): InviteAdminRow {
  return {
    id: row.id,
    token: row.token,
    label: row.label,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    expiresAt: row.expires_at,
    active: row.active,
    createdAt: row.created_at,
    signupUrl: buildSignupUrl(row.token),
  };
}

export async function listInvitesForAdmin(): Promise<InviteAdminRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_tokens")
    .select(
      "id, token, label, max_uses, used_count, expires_at, active, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as InviteTokenRow[]).map(toInviteRow);
}

export async function createInviteForAdmin(
  input: CreateInviteInput,
): Promise<CreatedInvite> {
  return createInviteToken(input);
}

export async function setInviteActive(
  id: string,
  active: boolean,
): Promise<InviteAdminRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_tokens")
    .update({ active })
    .eq("id", id)
    .select(
      "id, token, label, max_uses, used_count, expires_at, active, created_at",
    )
    .single();

  if (error) throw error;
  return toInviteRow(data as InviteTokenRow);
}
