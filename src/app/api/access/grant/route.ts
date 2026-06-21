import { NextResponse } from "next/server";
import { grantMemberAccess } from "@/lib/access/grant";
import { verifyGrantSecret } from "@/lib/access/secret";
import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";

type Body = { email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Provisiona acesso de membro para um e-mail (chamada máquina-a-máquina).
 * Cria a conta se não existir (idempotente) e retorna um magic link pronto.
 * Protegido por ACCESS_GRANT_SECRET — não usa sessão de admin.
 */
export async function POST(request: Request) {
  // Auth primeiro: só chamador autorizado descobre estado de config.
  const auth = verifyGrantSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isSupabaseEnabled() || !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Serviço de acesso indisponível." },
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

  try {
    const result = await grantMemberAccess(email);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Não logar o e-mail (PII) — só a mensagem do erro.
    console.error("[api/access/grant]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Não foi possível gerar o acesso." },
      { status: 500 },
    );
  }
}
