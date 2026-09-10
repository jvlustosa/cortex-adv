import { Resend } from "resend";

// Só mail.chatjuridico.com.br existe na conta Resend do Chat Jurídico. From na
// raiz (chatjuridico.com.br) é recusado mesmo sendo o domínio pai.
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "no-reply@mail.chatjuridico.com.br";
const FROM_NAME = process.env.RESEND_FROM_NAME ?? "Claude Academy";
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "suporte@chatjuridico.com.br";

/**
 * Resend configurado com uma API key real (não placeholder).
 * Chaves do Resend começam com "re_"; use para falhar cedo e honesto em vez
 * de disparar um envio fadado a quebrar.
 */
export function isEmailConfigured(): boolean {
  return (process.env.RESEND_API_KEY ?? "").startsWith("re_");
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith("re_")) {
    throw new Error("RESEND_API_KEY ausente ou inválida.");
  }
  return new Resend(apiKey);
}

/**
 * Envia um e-mail transacional via Resend (APENAS servidor).
 * Lança se a API key não estiver configurada — o chamador decide como degradar.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<void> {
  const { error } = await getClient().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    replyTo: REPLY_TO,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
