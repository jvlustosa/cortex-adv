import { readApiErrorMessage } from "@/lib/errors/format";
import { WAITLIST_API_URL } from "@/lib/site";

/**
 * Helper único do formulário de lista de espera: máscara, validação, corpo da
 * requisição e envio. Usado pelo form da home e pelo gate do grupo aberto —
 * mesmos campos e mesmas mensagens do popup do site.
 */

export const DDI_OPTIONS = [
  { value: "+55", label: "🇧🇷 +55", min: 10, max: 11 },
  { value: "+1", label: "🇺🇸 +1", min: 10, max: 10 },
  { value: "+351", label: "🇵🇹 +351", min: 9, max: 9 },
  { value: "+54", label: "🇦🇷 +54", min: 10, max: 11 },
  { value: "+34", label: "🇪🇸 +34", min: 9, max: 9 },
  { value: "+39", label: "🇮🇹 +39", min: 9, max: 11 },
  { value: "+44", label: "🇬🇧 +44", min: 10, max: 10 },
  { value: "+33", label: "🇫🇷 +33", min: 9, max: 9 },
  { value: "+49", label: "🇩🇪 +49", min: 10, max: 11 },
  { value: "+56", label: "🇨🇱 +56", min: 9, max: 9 },
  { value: "+57", label: "🇨🇴 +57", min: 10, max: 10 },
  { value: "+52", label: "🇲🇽 +52", min: 10, max: 10 },
  { value: "+595", label: "🇵🇾 +595", min: 9, max: 9 },
  { value: "+598", label: "🇺🇾 +598", min: 8, max: 9 },
] as const;

export type DdiOption = (typeof DDI_OPTIONS)[number];

export const BRAZIL_DDI = "+55";

export type WaitlistFormValues = {
  nome: string;
  email: string;
  /** Como o usuário digitou (pode vir com máscara). */
  whatsapp: string;
  ddi: string;
  isClient: boolean;
};

export type WaitlistFormContext = {
  page: string;
  /** Query string já com "?" na frente, ou vazio. */
  urlParams: string;
  referrer: string;
  honeypot: string;
};

export function findDdi(value: string): DdiOption {
  return DDI_OPTIONS.find((option) => option.value === value) ?? DDI_OPTIONS[0];
}

export function formatBrazilPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length > 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length > 2) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length > 0) {
    return `(${digits}`;
  }
  return "";
}

/** Máscara por DDI: só o Brasil formata; o resto fica em dígitos puros. */
export function formatPhoneForDdi(ddi: string, value: string): string {
  if (ddi === BRAZIL_DDI) return formatBrazilPhone(value);
  return value.replace(/\D/g, "").slice(0, 15);
}

/** null = válido. String = mensagem pronta pra UI. */
export function validateWaitlistForm(values: WaitlistFormValues): string | null {
  const nome = values.nome.trim();
  const email = values.email.trim();
  const digits = values.whatsapp.replace(/\D/g, "");
  const ddi = findDdi(values.ddi);

  if (nome.length < 2) return "Informe seu nome.";
  if (email.length < 5 || !email.includes("@")) {
    return "Informe um e-mail válido.";
  }
  if (digits.length < ddi.min || digits.length > ddi.max) {
    return values.ddi === BRAZIL_DDI
      ? "Informe o WhatsApp com DDD."
      : "Informe o número de WhatsApp completo.";
  }
  return null;
}

/** Corpo aceito pelo /api/waitlist — mesmos campos que o popup do site manda. */
export function buildWaitlistRequestBody(
  values: WaitlistFormValues,
  context: WaitlistFormContext,
) {
  const digits = values.whatsapp.replace(/\D/g, "");

  return {
    nome: values.nome.trim(),
    email: values.email.trim(),
    whatsapp: `${values.ddi}${digits}`,
    whatsapp_ddi: values.ddi,
    whatsapp_local: values.whatsapp.trim(),
    is_client: values.isClient,
    page: context.page,
    url_params: context.urlParams,
    referrer: context.referrer,
    website: context.honeypot,
  };
}

export type WaitlistSubmitResult =
  | { ok: true }
  | { ok: false; message: string };

export async function submitWaitlist(
  values: WaitlistFormValues,
  context: WaitlistFormContext,
): Promise<WaitlistSubmitResult> {
  const invalid = validateWaitlistForm(values);
  if (invalid) return { ok: false, message: invalid };

  try {
    const res = await fetch(WAITLIST_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildWaitlistRequestBody(values, context)),
    });

    if (!res.ok) {
      return {
        ok: false,
        message: await readApiErrorMessage(
          res,
          "Não foi possível enviar. Tente de novo em instantes.",
        ),
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Erro de conexão. Verifique a internet e tente novamente.",
    };
  }
}
