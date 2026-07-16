import { NextResponse } from "next/server";
import {
  createInviteForAdmin,
  listInvitesForAdmin,
  setInviteActive,
} from "@/lib/admin/invites-repository";
import { sendInviteEmail } from "@/lib/email/invite-email";
import { assertAdminApi } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const invites = await listInvitesForAdmin();
    return NextResponse.json({ invites });
  } catch (err) {
    console.error("[api/admin/invites GET]", err);
    return NextResponse.json(
      { error: "Erro ao carregar convites." },
      { status: 500 },
    );
  }
}

type PostBody = {
  label?: string;
  maxUses?: number;
  expiresAt?: string | null;
  token?: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientTitle?: string | null;
};

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
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
    const invite = await createInviteForAdmin({
      label: typeof body.label === "string" ? body.label : undefined,
      maxUses: Number.isFinite(maxUses) ? maxUses : undefined,
      expiresAt: body.expiresAt ?? undefined,
      token: typeof body.token === "string" ? body.token : undefined,
      recipientName:
        typeof body.recipientName === "string" ? body.recipientName : undefined,
      recipientEmail:
        typeof body.recipientEmail === "string" ? body.recipientEmail : undefined,
      recipientTitle:
        typeof body.recipientTitle === "string" ? body.recipientTitle : undefined,
    });

    // Dispara o e-mail só quando há destinatário. Uma falha no envio não desfaz
    // o convite: devolvemos o status para a UI avisar e oferecer reenvio.
    let email: { sent: boolean; error?: string } | null = null;
    if (invite.recipientEmail) {
      const result = await sendInviteEmail(invite);
      email = result.ok ? { sent: true } : { sent: false, error: result.error };
      if (!result.ok) {
        console.error("[api/admin/invites POST] envio de e-mail falhou", {
          inviteId: invite.id,
          error: result.error,
        });
      }
    }

    return NextResponse.json({ ok: true, invite, email });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar convite.";
    console.error("[api/admin/invites POST]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

type PatchBody = {
  id?: string;
  active?: boolean;
};

export async function PATCH(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.id || typeof body.active !== "boolean") {
    return NextResponse.json(
      { error: "id e active são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const invite = await setInviteActive(body.id, body.active);
    return NextResponse.json({ ok: true, invite });
  } catch (err) {
    console.error("[api/admin/invites PATCH]", err);
    return NextResponse.json(
      { error: "Erro ao atualizar convite." },
      { status: 500 },
    );
  }
}
