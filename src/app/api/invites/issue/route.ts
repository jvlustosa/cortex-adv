import { NextResponse } from "next/server";
import { verifyInviteSecret } from "@/lib/invites/secret";
import { createInviteToken } from "@/lib/invites/create";
import { sendInviteEmail } from "@/lib/email/invite-email";
import { isEmailConfigured } from "@/lib/email/send";
import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";

type Body = {
  email?: string;
  name?: string;
  title?: string | null;
  label?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Emite um convite do Claude Academy e o envia por e-mail (SendGrid). Chamada
 * máquina-a-máquina (n8n, pós-assinatura Asaas), protegida por
 * INVITE_ISSUE_SECRET — não usa sessão de admin.
 *
 * Cria o token em invite_tokens e dispara o e-mail com o link /signup?token=.
 * NÃO devolve o token/link na resposta: é credencial de acesso e não deve
 * transitar por terceiros (n8n) nem cair em log. Se o e-mail falhar depois do
 * convite criado, responde 502 para o chamador cair no fallback (avisar no
 * Slack e gerar o convite na mão pelo painel /admin).
 */
export async function POST(request: Request) {
  // Auth primeiro: só chamador autorizado descobre estado de config.
  const auth = verifyInviteSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Serviço de convites indisponível." },
      { status: 503 },
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Envio de e-mail indisponível." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";

  let invite;
  try {
    invite = await createInviteToken({
      maxUses: 1,
      label: body.label?.trim() || "Assinatura Asaas",
      recipientName: name || null,
      recipientEmail: email,
      recipientTitle: body.title ?? null,
    });
  } catch (err) {
    // Título inválido vem do normalizeInviteTitle (erro do chamador → 400);
    // qualquer outra falha de criação é inesperada (500). Nunca logar o e-mail.
    const message = err instanceof Error ? err.message : "Erro ao criar convite.";
    const isBadInput = message.toLowerCase().includes("título");
    console.error("[api/invites/issue] criar", message);
    return NextResponse.json(
      { error: message },
      { status: isBadInput ? 400 : 500 },
    );
  }

  const result = await sendInviteEmail(invite);
  if (!result.ok) {
    // Convite criado, e-mail falhou. 502 → chamador usa o fallback manual.
    console.error("[api/invites/issue] envio de e-mail falhou", {
      inviteId: invite.id,
      error: result.error,
    });
    return NextResponse.json(
      { ok: false, created: true, emailed: false, error: result.error },
      { status: 502 },
    );
  }

  // Sem token/link na resposta: é credencial de acesso, não sai daqui.
  return NextResponse.json({ ok: true, created: true, emailed: true });
}
