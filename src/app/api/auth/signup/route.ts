import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

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

  const { data: invite, error: inviteErr } = await admin
    .from("invite_tokens")
    .select("id, max_uses, used_count, expires_at, active")
    .eq("token", token)
    .maybeSingle();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: "Convite inválido ou inexistente." }, { status: 400 });
  }

  if (!invite.active) {
    return NextResponse.json({ error: "Este convite foi desativado." }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Este convite expirou." }, { status: 400 });
  }

  if (invite.used_count >= invite.max_uses) {
    return NextResponse.json({ error: "Este convite já foi utilizado." }, { status: 400 });
  }

  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { invite_token_id: invite.id },
  });

  if (createErr) {
    const msg = createErr.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already been")) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado. Use Entrar." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: createErr.message }, { status: 400 });
  }

  const { error: updateErr } = await admin
    .from("invite_tokens")
    .update({ used_count: invite.used_count + 1 })
    .eq("id", invite.id);

  if (updateErr) {
    console.error("Falha ao atualizar convite:", updateErr);
  }

  return NextResponse.json({ ok: true });
}
