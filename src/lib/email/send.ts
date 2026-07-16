import sgMail from "@sendgrid/mail";

const FROM_EMAIL =
  process.env.SENDGRID_FROM_EMAIL ?? "no-reply@chatjuridico.com.br";
const FROM_NAME = process.env.SENDGRID_FROM_NAME ?? "Claude Academy";

/**
 * SendGrid configurado com uma API key real (não placeholder).
 * Chaves do SendGrid começam com "SG."; use para falhar cedo e honesto em vez
 * de disparar um envio fadado a quebrar.
 */
export function isEmailConfigured(): boolean {
  return (process.env.SENDGRID_API_KEY ?? "").startsWith("SG.");
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Envia um e-mail transacional via SendGrid (APENAS servidor).
 * Lança se a API key não estiver configurada — o chamador decide como degradar.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey || !apiKey.startsWith("SG.")) {
    throw new Error("SENDGRID_API_KEY ausente ou inválida.");
  }

  sgMail.setApiKey(apiKey);
  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    text,
    html,
  });
}
