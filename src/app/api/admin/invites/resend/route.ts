import { NextResponse } from "next/server";
import { getInviteById } from "@/lib/admin/invites-repository";
import { sendInviteEmail } from "@/lib/email/invite-email";
import { assertAdminApi } from "@/lib/admin/require-admin";

type ResendBody = { id?: string };

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) return auth.error;

  let body: ResendBody;
  try {
    body = (await request.json()) as ResendBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  }

  try {
    const invite = await getInviteById(body.id);
    if (!invite) {
      return NextResponse.json(
        { error: "Convite não encontrado." },
        { status: 404 },
      );
    }
    if (!invite.recipientEmail) {
      return NextResponse.json(
        { error: "Este convite não tem e-mail do destinatário." },
        { status: 400 },
      );
    }

    const result = await sendInviteEmail(invite);
    if (!result.ok) {
      // Não logar o e-mail (PII), só o id do convite.
      console.error("[api/admin/invites/resend]", {
        inviteId: invite.id,
        error: result.error,
      });
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, email: { sent: true } });
  } catch (err) {
    console.error("[api/admin/invites/resend]", err);
    return NextResponse.json(
      { error: "Erro ao reenviar convite." },
      { status: 500 },
    );
  }
}
