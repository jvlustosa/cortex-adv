export type InviteTitle = "dr" | "dra";

export type InviteTokenRow = {
  id: string;
  token: string;
  label: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_title: InviteTitle | null;
};

export type CreateInviteInput = {
  label?: string;
  maxUses?: number;
  expiresAt?: string | Date | null;
  token?: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientTitle?: InviteTitle | string | null;
};

export type CreatedInvite = {
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
