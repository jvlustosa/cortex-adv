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
 * Webhook do n8n que trata a inscrição: grava na planilha e avisa no Slack.
 * Override via N8N_WAITLIST_WEBHOOK_URL; default aponta para produção.
 */
export function resolveN8nWebhookUrl(): string {
  return (
    process.env.N8N_WAITLIST_WEBHOOK_URL ??
    "https://flowhook.chatjuridico.com/webhook/formulario/waitlist-claude-academy"
  );
}

function formatWhatsapp(data: WaitlistPayload): string {
  if (data.whatsapp.startsWith("+")) return data.whatsapp;
  if (data.whatsapp_ddi && data.whatsapp) {
    return `${data.whatsapp_ddi} ${data.whatsapp}`;
  }
  return data.whatsapp || "";
}

/** Payload estruturado enviado ao n8n — cada campo vira uma coluna na planilha. */
export function buildN8nWaitlistPayload(data: WaitlistPayload) {
  const params = new URLSearchParams((data.url_params || "").replace(/^\?/, ""));

  return {
    origem: "claude-academy",
    recebido_em: new Date().toISOString(),
    nome: data.nome,
    email: data.email,
    whatsapp: formatWhatsapp(data),
    whatsapp_ddi: data.whatsapp_ddi,
    whatsapp_digits: data.whatsapp_digits,
    is_client: data.is_client,
    cliente_label: data.is_client ? "Sim" : "Não",
    pagina: data.pagina,
    referrer: data.referrer,
    url_params: data.url_params,
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
  };
}
