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

export function resolveSlackWebhookUrl(): string {
  const primary = process.env.SLACK_WEBHOOK_CLAUDE_ACADEMY ?? "";
  if (primary.startsWith("https://hooks.slack.com/")) return primary;

  const testing =
    process.env.SLACK_WEBHOOK_TESTING ?? process.env.SLACK_WEBHOOK_TEST ?? "";
  return testing.startsWith("https://hooks.slack.com/") ? testing : "";
}

function formatWhatsapp(data: WaitlistPayload): string {
  if (data.whatsapp.startsWith("+")) return data.whatsapp;
  if (data.whatsapp_ddi && data.whatsapp) {
    return `${data.whatsapp_ddi} ${data.whatsapp}`;
  }
  return data.whatsapp || "-";
}

export function buildSlackWaitlistMessage(data: WaitlistPayload): { text: string } {
  const params = new URLSearchParams((data.url_params || "").replace(/^\?/, ""));
  const utm = ["utm_source", "utm_medium", "utm_campaign"]
    .map((key) => {
      const value = params.get(key);
      return value ? `${key.replace("utm_", "")}: ${value}` : null;
    })
    .filter(Boolean)
    .join(" · ");

  const lines = [
    "Nova inscrição Claude Academy",
    `Nome: ${data.nome || "-"}`,
    `E-mail: ${data.email || "-"}`,
    `WhatsApp: ${formatWhatsapp(data)}`,
    `Cliente Chat Jurídico: ${data.is_client ? "Sim" : "Não"}`,
    `Página: ${data.pagina || "-"}`,
  ];

  if (utm) lines.push(`UTM: ${utm}`);
  if (data.referrer) lines.push(`Referrer: ${data.referrer}`);

  return { text: lines.join("\n") };
}
