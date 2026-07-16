import { NextResponse } from "next/server";
import { grantMemberAccess } from "@/lib/access/grant";
import { verifyGrantSecret } from "@/lib/access/secret";
import { sendAccessEmail } from "@/lib/email/access-email";
import { isEmailConfigured } from "@/lib/email/send";
import { isServiceRoleConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";

type Body = { email?: string; sendEmail?: boolean; name?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Provisiona acesso de membro para um e-mail (chamada máquina-a-máquina).
 * Cria a conta se não existir (idempotente) e retorna um magic link pronto.
 * Protegido por ACCESS_GRANT_SECRET — não usa sessão de admin.
 *
 * Com `sendEmail: true`, o próprio endpoint envia o magic link por e-mail
 * (SendGrid) e NÃO o devolve na resposta — assim a credencial de login não
 * transita por sistemas de terceiros (ex.: n8n) nem cai em log. Usado no fluxo
 * pós-pagamento do Asaas. `name` personaliza a saudação do e-mail.
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

    if (!body.sendEmail) {
      return NextResponse.json({ ok: true, ...result });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Envio de e-mail indisponível." },
        { status: 503 },
      );
    }

    try {
      await sendAccessEmail({
        to: result.email,
        magicLink: result.magicLink,
        name: typeof body.name === "string" ? body.name : undefined,
      });
    } catch (err) {
      // Conta já provisionada (grant é idempotente); só o e-mail falhou. Sinaliza
      // distinto (502) para o chamador reprocessar com segurança.
      console.error(
        "[api/access/grant] email",
        err instanceof Error ? err.message : err,
      );
      return NextResponse.json(
        { error: "Acesso criado, mas o envio do e-mail falhou." },
        { status: 502 },
      );
    }

    // Sem magicLink na resposta: é credencial de login, não deve sair daqui.
    return NextResponse.json({
      ok: true,
      email: result.email,
      created: result.created,
      emailed: true,
    });
  } catch (err) {
    // Não logar o e-mail (PII) — só a mensagem do erro.
    console.error("[api/access/grant]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Não foi possível gerar o acesso." },
      { status: 500 },
    );
  }
}
