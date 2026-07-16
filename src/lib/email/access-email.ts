import { SITE_NAME, SITE_URL } from "@/lib/site";
import { sendEmail } from "./send";

/** Terracota Claude (paleta do app). */
const BRAND = "#d97757";

function firstName(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}

function greeting(name?: string | null): string {
  const first = firstName(name);
  return first ? `Olá, ${first}!` : "Olá!";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AccessEmailInput = {
  to: string;
  magicLink: string;
  name?: string | null;
};

/**
 * E-mail de boas-vindas com o link de acesso (magic link) do Claude Academy.
 * Enviado após a confirmação de pagamento. O link cai direto na área de
 * membros; se expirar, o aluno pede outro em /login com o mesmo e-mail (a
 * conta já existe). O link é credencial de login, então só vai para o comprador.
 */
export async function sendAccessEmail({
  to,
  magicLink,
  name,
}: AccessEmailInput): Promise<void> {
  const loginUrl = new URL("/login", SITE_URL).toString();
  const subject = `Seu acesso ao ${SITE_NAME} está liberado`;

  const text = [
    greeting(name),
    "",
    `Seu pagamento foi confirmado e o acesso ao ${SITE_NAME} já está liberado.`,
    "",
    "Entrar agora:",
    magicLink,
    "",
    `O link te leva direto pra área de membros. Se ele expirar, é só acessar ${loginUrl} com esse mesmo e-mail e pedir um link novo.`,
    "",
    "Bons estudos!",
    SITE_NAME,
  ].join("\n");

  const safeGreeting = escapeHtml(greeting(name));
  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="background:#111111;padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">${escapeHtml(SITE_NAME)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:18px;font-weight:600;">${safeGreeting}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">
                  Seu pagamento foi confirmado e o acesso ao ${escapeHtml(SITE_NAME)} já está liberado. É só clicar no botão abaixo pra entrar.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td align="center" style="border-radius:10px;background:${BRAND};">
                      <a href="${escapeHtml(magicLink)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                        Acessar o curso
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
                  O link te leva direto pra área de membros. Se ele expirar, acesse
                  <a href="${escapeHtml(loginUrl)}" style="color:${BRAND};text-decoration:none;">${escapeHtml(loginUrl)}</a>
                  com esse mesmo e-mail e peça um link novo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
                <span style="font-size:12px;color:#a1a1aa;">${escapeHtml(SITE_NAME)} · Chat Jurídico</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await sendEmail({ to, subject, html, text });
}
