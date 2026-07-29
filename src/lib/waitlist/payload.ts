export type WaitlistPayload = {
  nome: string;
  email: string;
  whatsapp: string;
  whatsapp_ddi: string;
  whatsapp_digits: string;
  is_client: boolean;
  pagina: string;
  referrer: string;
  url_params: string;
};

export function sanitizeWaitlistField(
  value: unknown,
  max = 500,
): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").substring(0, max).trim();
}

export function parseWaitlistPayload(body: Record<string, unknown>): WaitlistPayload {
  const whatsapp = sanitizeWaitlistField(body.whatsapp ?? body.phone, 40);
  const whatsapp_ddi = sanitizeWaitlistField(body.whatsapp_ddi, 8);

  return {
    nome: sanitizeWaitlistField(body.nome ?? body.name, 120),
    email: sanitizeWaitlistField(body.email, 200),
    whatsapp,
    whatsapp_ddi,
    whatsapp_digits: whatsapp.replace(/\D/g, ""),
    is_client: Boolean(body.is_client),
    pagina: sanitizeWaitlistField(body.page, 300) || "/",
    referrer: sanitizeWaitlistField(body.referrer, 300),
    url_params: sanitizeWaitlistField(body.url_params, 500),
  };
}

export function validateWaitlistPayload(data: WaitlistPayload): {
  ok: boolean;
  message?: string;
} {
  if (data.nome.length < 2) {
    return { ok: false, message: "Informe seu nome completo." };
  }
  if (data.email.length < 5 || !data.email.includes("@")) {
    return { ok: false, message: "E-mail válido é obrigatório." };
  }
  if (data.whatsapp_digits.length < 10 || data.whatsapp_digits.length > 13) {
    return { ok: false, message: "WhatsApp com DDD é obrigatório." };
  }
  return { ok: true };
}

/**
 * Mesmo endpoint que o popup do chatjuridico.com.br usa (`/api/claude-academy-waitlist`,
 * que manda pro Slack). A barra final evita o 308 de trailing slash da Vercel.
 * Override via WAITLIST_FORWARD_URL — é por aí que se volta pro n8n, se a
 * planilha voltar a existir.
 */
export function resolveWaitlistForwardUrl(): string {
  return (
    process.env.WAITLIST_FORWARD_URL ??
    "https://chatjuridico.com.br/api/claude-academy-waitlist/"
  );
}

/**
 * Corpo no formato que o handler do site espera — ele faz o próprio sanitize,
 * a própria validação e extrai as UTMs de `url_params`. `fonte` é o que separa
 * no Slack o lead da Academy do lead do site.
 */
export function buildWaitlistForwardPayload(data: WaitlistPayload) {
  return {
    nome: data.nome,
    email: data.email,
    whatsapp: data.whatsapp,
    whatsapp_ddi: data.whatsapp_ddi,
    is_client: data.is_client,
    page: data.pagina,
    referrer: data.referrer,
    url_params: data.url_params,
    fonte: "claude-academy",
  };
}
