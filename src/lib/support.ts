/** WhatsApp de suporte do curso (+55 11 93621-6714). */
export const COURSE_SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "5511936216714";

export const COURSE_SUPPORT_PHONE_DISPLAY = "+55 11 93621-6714";

export function buildCourseSupportWhatsAppUrl(email?: string | null): string {
  const lines = ["Olá! Vim do curso Claude Academy (área de membros)."];

  if (email?.trim()) {
    lines.push(`Meu e-mail cadastrado: ${email.trim().toLowerCase()}`);
  }

  lines.push("", "Preciso de ajuda com:");

  return `https://wa.me/${COURSE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildErrorSupportWhatsAppUrl(detail: string, digest?: string): string {
  const lines = [
    "Olá! Tive um erro no site da Claude Academy.",
    "",
    "Detalhe técnico:",
    detail.slice(0, 400),
  ];

  if (digest) {
    lines.push("", `Referência: ${digest}`);
  }

  lines.push("", "Preciso de ajuda com:");

  return `https://wa.me/${COURSE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
}
