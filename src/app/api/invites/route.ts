import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createInviteToken } from "@/lib/invites/create";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

type Body = {
  label?: string;
  maxUses?: number;
  expiresAt?: string | null;
  token?: string;
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.INVITE_ADMIN_SECRET;
  if (!secret) return false;

  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-invite-admin-secret");

  if (!header) return false;

  const expected = Buffer.from(secret);
  const received = Buffer.from(header);

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json(
      { error: "Supabase desativado." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const maxUses =
    typeof body.maxUses === "number"
      ? body.maxUses
      : typeof body.maxUses === "string"
        ? Number.parseInt(body.maxUses, 10)
        : undefined;

  try {
    const invite = await createInviteToken({
      label: typeof body.label === "string" ? body.label : undefined,
      maxUses: Number.isFinite(maxUses) ? maxUses : undefined,
      expiresAt: body.expiresAt ?? undefined,
      token: typeof body.token === "string" ? body.token : undefined,
    });

    return NextResponse.json({ ok: true, invite });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar convite.";
    console.error("[api/invites]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
