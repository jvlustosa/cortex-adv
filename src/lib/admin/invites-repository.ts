import { createAdminClient } from "@/lib/supabase/admin";
import { createInviteToken } from "@/lib/invites/create";
import { buildSignupUrl } from "@/lib/invites/signup-url";
import type {
  CreateInviteInput,
  CreatedInvite,
  InviteTitle,
  InviteTokenRow,
} from "@/lib/invites/types";

const INVITE_COLUMNS =
  "id, token, label, max_uses, used_count, expires_at, active, created_at, recipient_name, recipient_email, recipient_title";

export type InviteAdminRow = {
  id: string;
  token: string;
  label: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientTitle: InviteTitle | null;
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
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    recipientTitle: row.recipient_title,
    signupUrl: buildSignupUrl(row.token),
  };
}

export async function listInvitesForAdmin(): Promise<InviteAdminRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_tokens")
    .select(INVITE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as InviteTokenRow[]).map(toInviteRow);
}

export async function createInviteForAdmin(
  input: CreateInviteInput,
): Promise<CreatedInvite> {
  return createInviteToken(input);
}

export async function getInviteById(id: string): Promise<InviteAdminRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_tokens")
    .select(INVITE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toInviteRow(data as InviteTokenRow);
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
    .select(INVITE_COLUMNS)
    .single();

  if (error) throw error;
  return toInviteRow(data as InviteTokenRow);
}
