import { NextResponse } from "next/server";
import { mapSignupServerError } from "@/lib/errors/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSignupEnabled, isSupabaseEnabled } from "@/lib/supabase/enabled";

type Body = {
  email?: string;
  password?: string;
  token?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json(
      { error: "Cadastro temporariamente indisponível." },
      { status: 503 },
    );
  }

  if (!isSignupEnabled()) {
    return NextResponse.json({ error: "Cadastro indisponível." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!email || !password || !token) {
    return NextResponse.json(
      { error: "E-mail, senha e token de convite são obrigatórios." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 8 caracteres." },
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
  // Evita a race de resgate: dois cadastros simultâneos com o mesmo token de uso
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

  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { invite_token_id: invite.id },
  });

  if (createErr) {
    // Usuário não foi criado: devolve o uso consumido. Compare-and-swap em used_count
    // garante que só revertemos se nenhum outro cadastro consumiu o convite nesse meio-tempo.
    const { error: rollbackErr } = await admin
      .from("invite_tokens")
      .update({ used_count: invite.used_count - 1 })
      .eq("id", invite.id)
      .eq("used_count", invite.used_count);

    if (rollbackErr) {
      console.error("[api/auth/signup] rollback used_count", rollbackErr);
    }

    const msg = createErr.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already been")) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado. Use Entrar." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: mapSignupServerError(createErr.message) },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
