export type InviteTokenRow = {
  id: string;
  token: string;
  label: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

export type CreateInviteInput = {
  label?: string;
  maxUses?: number;
  expiresAt?: string | Date | null;
  token?: string;
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
  signupUrl: string;
};
