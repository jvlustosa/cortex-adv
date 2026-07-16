import { sendEmail, type SendEmailResult } from "@/lib/email/sendgrid";
import { buildInviteGreeting } from "./recipient";
import type { InviteTitle } from "./types";

/** Campos mínimos de um convite necessários para montar o e-mail. */
export type InviteEmailInput = {
  signupUrl: string;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientTitle: InviteTitle | null;
};

export type InviteEmailContent = {
  subject: string;
  html: string;
  text: string;
};

const FALLBACK_GREETING = "Olá";
const SUBJECT = "Seu acesso ao Claude Academy";
const SUPPORT_NOTE = "Se você não reconhece este convite, é só ignorar este e-mail.";
const SIGNATURE = "Equipe Chat Jurídico";
const INTRO =
  "Você foi convidado para o Claude Academy, o curso do Chat Jurídico sobre usar o Claude no dia a dia da advocacia.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml(greeting: string, url: string): string {
  const safeGreeting = escapeHtml(greeting);
  const safeUrl = escapeHtml(url);

  return `<div style="background:#f5f4f0;padding:32px 0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e7e4dd;overflow:hidden;">
    <div style="padding:22px 28px;border-bottom:1px solid #efece6;">
      <span style="font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#d97757;">Claude Academy</span>
      <div style="font-size:12px;color:#8a8a8a;margin-top:2px;">by Chat Jurídico</div>
    </div>
    <div style="padding:28px;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 12px;">${safeGreeting},</p>
      <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 22px;">${INTRO} É rápido: clique no botão e crie seu acesso.</p>
      <a href="${safeUrl}" style="display:inline-block;background:#d97757;color:#0a0a0a;font-size:14px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;">Ativar meu acesso</a>
      <p style="font-size:12px;line-height:1.6;color:#8a8a8a;margin:22px 0 0;">Se o botão não funcionar, copie e cole este link no navegador:<br><a href="${safeUrl}" style="color:#d97757;word-break:break-all;">${safeUrl}</a></p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #efece6;font-size:12px;line-height:1.6;color:#8a8a8a;">${SUPPORT_NOTE}<br>${SIGNATURE}</div>
  </div>
</div>`;
}

/**
 * Monta o e-mail do convite (assunto, HTML e texto). Função pura — a saudação
 * concorda o gênero com o título quando existe (Dra./Dr.) e cai num "Olá"
 * genérico sem nome.
 */
export function buildInviteEmail(invite: InviteEmailInput): InviteEmailContent {
  const greeting =
    buildInviteGreeting({
      name: invite.recipientName,
      title: invite.recipientTitle,
    }) ?? FALLBACK_GREETING;

  const url = invite.signupUrl;

  const text = [
    `${greeting},`,
    "",
    INTRO,
    "",
    "Ative seu acesso por este link:",
    url,
    "",
    SUPPORT_NOTE,
    SIGNATURE,
  ].join("\n");

  return { subject: SUBJECT, html: renderHtml(greeting, url), text };
}

/**
 * Envia o convite por e-mail. Exige e-mail do destinatário; sem ele, devolve
 * erro estruturado (o convite ainda pode existir, só não há para quem enviar).
 */
export async function sendInviteEmail(
  invite: InviteEmailInput,
): Promise<SendEmailResult> {
  const to = invite.recipientEmail?.trim();
  if (!to) {
    return { ok: false, error: "Convite sem e-mail do destinatário." };
  }
  return sendEmail({ to, ...buildInviteEmail(invite) });
}
