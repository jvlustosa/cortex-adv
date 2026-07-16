import { NextResponse } from "next/server";
import { grantMemberAccess } from "@/lib/access/grant";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

type Body = {
  email?: string;
  token?: string;
  next?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Ativa o acesso de um convite (/signup?token=). Fluxo passwordless: o produto
 * inteiro entra por magic link (login = signInWithOtp), então o convite não pede
 * senha — só consome o token e devolve um link de acesso pronto pra /auth/confirm.
 *
 * O portão é o próprio token de convite (consumido atomicamente no banco), não uma
 * flag global de cadastro: quem não tem convite não cria conta.
 */
export async function POST(request: Request) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json(
      { error: "Cadastro temporariamente indisponível." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const postedEmail =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const next = safeRedirectPath(typeof body.next === "string" ? body.next : undefined);

  if (!token) {
    return NextResponse.json(
      { error: "Token de convite obrigatório." },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Servidor não configurado (Supabase service role)." },
      { status: 503 },
    );
  }

  // Consumo atômico do convite (valida + incrementa used_count sob lock no banco).
  // Evita a race de resgate: dois acessos simultâneos com o mesmo token de uso
  // único não conseguem ambos passar pela validação.
  const { data: consumed, error: consumeErr } = await admin.rpc(
    "consume_invite_token",
    { p_token: token },
  );

  if (consumeErr) {
    const reason = consumeErr.message ?? "";
    if (reason.includes("invite_inactive")) {
      return NextResponse.json({ error: "Este convite foi desativado." }, { status: 400 });
    }
    if (reason.includes("invite_expired")) {
      return NextResponse.json({ error: "Este convite expirou." }, { status: 400 });
    }
    if (reason.includes("invite_exhausted")) {
      return NextResponse.json({ error: "Este convite já foi utilizado." }, { status: 400 });
    }
    console.error("[api/auth/signup] consume_invite_token", consumeErr);
    return NextResponse.json({ error: "Erro ao validar convite." }, { status: 500 });
  }

  const invite = Array.isArray(consumed) ? consumed[0] : consumed;
  if (!invite) {
    return NextResponse.json({ error: "Convite inválido ou inexistente." }, { status: 400 });
  }

  // E-mail vem do convite quando ele é nominal; convites genéricos (multiuso, sem
  // e-mail) usam o que a pessoa digitou. Nunca confia só no cliente pra convite nominal.
  const { data: recipientRow } = await admin
    .from("invite_tokens")
    .select("recipient_name, recipient_email")
    .eq("id", invite.id)
    .maybeSingle();

  const inviteEmail = recipientRow?.recipient_email?.trim().toLowerCase() || "";
  const email = inviteEmail || postedEmail;
  const fullName = recipientRow?.recipient_name?.trim() || undefined;

  if (!email || !EMAIL_RE.test(email)) {
    // Convite sem e-mail e sem e-mail digitado: devolve o uso consumido.
    await rollbackInviteUse(admin, invite);
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  try {
    // Provisiona a conta passwordless (idempotente) e gera o link de acesso.
    const result = await grantMemberAccess(email, { fullName, next });
    return NextResponse.json({ ok: true, redirectTo: result.magicLink });
  } catch (err) {
    // Falha ao provisionar: devolve o uso consumido pra não queimar o convite.
    await rollbackInviteUse(admin, invite);
    console.error("[api/auth/signup] grantMemberAccess", err);
    return NextResponse.json(
      { error: "Não foi possível ativar o acesso. Tente novamente." },
      { status: 500 },
    );
  }
}

/**
 * Devolve o uso consumido via compare-and-swap em used_count: só reverte se
 * nenhum outro acesso consumiu o convite nesse meio-tempo.
 */
async function rollbackInviteUse(
  admin: ReturnType<typeof createAdminClient>,
  invite: { id: string; used_count: number },
): Promise<void> {
  const { error } = await admin
    .from("invite_tokens")
    .update({ used_count: invite.used_count - 1 })
    .eq("id", invite.id)
    .eq("used_count", invite.used_count);
  if (error) {
    console.error("[api/auth/signup] rollback used_count", error);
  }
}
