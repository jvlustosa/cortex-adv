import { SITE_NAME } from "@/lib/site";
import { isEmailConfigured, sendEmail } from "./send";
import { buildInviteGreeting } from "@/lib/invites/recipient";
import type { InviteTitle } from "@/lib/invites/types";

/** Terracota Claude (paleta do app). */
const BRAND = "#d97757";

/** Campos mínimos de um convite necessários para montar o e-mail. */
export type InviteEmailInput = {
  signupUrl: string;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientTitle: InviteTitle | null;
};

export type SendInviteEmailResult = { ok: true } | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function greeting(name: string | null, title: InviteTitle | null): string {
  return buildInviteGreeting({ name, title }) ?? "Olá!";
}

const INTRO = `Você foi convidado para o ${SITE_NAME}, o curso do Chat Jurídico sobre usar o Claude no dia a dia da advocacia.`;

/**
 * Monta o e-mail do convite (assunto, HTML e texto). Função pura — a saudação
 * concorda o gênero com o título quando existe (Dra./Dr.) e cai num "Olá!"
 * genérico sem nome. Mesmo layout do e-mail de acesso (access-email).
 */
export function buildInviteEmail(invite: InviteEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const hello = greeting(invite.recipientName, invite.recipientTitle);
  const url = invite.signupUrl;
  const subject = `Seu convite para o ${SITE_NAME}`;

  const text = [
    hello,
    "",
    INTRO,
    "",
    "Ative seu acesso por este link:",
    url,
    "",
    "Se você não reconhece este convite, é só ignorar este e-mail.",
    SITE_NAME,
  ].join("\n");

  const safeGreeting = escapeHtml(hello);
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
                  ${escapeHtml(INTRO)} É rápido: clique no botão abaixo e crie seu acesso.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td align="center" style="border-radius:10px;background:${BRAND};">
                      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                        Ativar meu acesso
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
                  Se o botão não funcionar, copie e cole este link no navegador:<br />
                  <a href="${escapeHtml(url)}" style="color:${BRAND};text-decoration:none;word-break:break-all;">${escapeHtml(url)}</a>
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

  return { subject, html, text };
}

/**
 * Envia o convite por e-mail via SendGrid. Retorna resultado estruturado em vez
 * de lançar: o convite pode ter sido criado mesmo assim, então quem chama
 * decide como avisar (UI mostra aviso + botão reenviar). Nunca loga o e-mail.
 */
export async function sendInviteEmail(
  invite: InviteEmailInput,
): Promise<SendInviteEmailResult> {
  const to = invite.recipientEmail?.trim();
  if (!to) {
    return { ok: false, error: "Convite sem e-mail do destinatário." };
  }
  if (!isEmailConfigured()) {
    return {
      ok: false,
      error: "Envio de e-mail indisponível (SendGrid não configurado).",
    };
  }

  try {
    await sendEmail({ to, ...buildInviteEmail(invite) });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha ao enviar e-mail.",
    };
  }
}
