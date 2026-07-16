import sgMail from "@sendgrid/mail";

const DEFAULT_FROM_NAME = "Claude Academy · Chat Jurídico";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = { ok: true } | { ok: false; error: string };

let apiKeyApplied = false;

function resolveConfig():
  | { fromEmail: string; fromName: string }
  | { error: string } {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      error:
        "SendGrid não configurado (defina SENDGRID_API_KEY e SENDGRID_FROM_EMAIL).",
    };
  }

  if (!apiKeyApplied) {
    sgMail.setApiKey(apiKey);
    apiKeyApplied = true;
  }

  return { fromEmail, fromName: DEFAULT_FROM_NAME };
}

function describeError(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const body = (
      err as { response?: { body?: { errors?: { message?: string }[] } } }
    ).response?.body;
    const first = body?.errors?.[0]?.message;
    if (first) return first;
  }
  return err instanceof Error ? err.message : "Falha ao enviar e-mail.";
}

/**
 * Envia um e-mail transacional via SendGrid (apenas servidor). Retorna resultado
 * estruturado em vez de lançar: o chamador decide o que fazer quando o envio
 * falha — no fluxo de convites, o convite é criado mesmo assim. Nunca loga o
 * destinatário (PII).
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const config = resolveConfig();
  if ("error" in config) return { ok: false, error: config.error };

  try {
    await sgMail.send({
      to: input.to,
      from: { email: config.fromEmail, name: config.fromName },
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: describeError(err) };
  }
}
