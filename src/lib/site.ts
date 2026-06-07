import { PRICING } from "@/lib/pricing";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://claudeacademy.chatjuridico.com.br";

export const SITE_HOST = new URL(SITE_URL).host;

export const SITE_NAME = "Claude Academy";

export const SITE_BYLINE = "by Chat Jurídico";

export const SITE_BRAND = `${SITE_NAME} · Chat Jurídico`;

export const CHAT_JURIDICO_URL =
  "https://chatjuridico.com.br?utm_source=claude_academy&utm_medium=referral";

/** Mesmo endpoint da LP /claude-academy/ no website (api/claude-academy-waitlist.js). */
export const WAITLIST_API_URL =
  process.env.NEXT_PUBLIC_WAITLIST_API_URL ??
  "https://chatjuridico.com.br/api/claude-academy-waitlist";

export const COURSE_MENTOR = {
  name: "Prof Marcos Vilas Boas",
  nameLines: ["Prof Marcos", "Vilas Boas"] as const,
  role: "O MENTOR",
} as const;

export const CHAT_JURIDICO_SOCIAL = {
  instagram: "https://www.instagram.com/chat_juridico",
  youtube: "https://www.youtube.com/@chatjuridico",
} as const;

/** Grupo aberto no WhatsApp: gratuito, qualquer advogado entra. */
export const OPEN_WHATSAPP_GROUP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/G2VXJ9UManZ77Rx7Uzn7NT";

export const COMMUNITY = {
  open: {
    name: "Grupo aberto",
    badge: "Grátis",
    tagline: "Qualquer advogado pode entrar",
    perks: [
      "Dicas de prompt e novidades do Claude Academy",
      "Troca informal entre advogados curiosos com IA",
      "Avisos de lançamento e lista de espera",
    ],
    note: "Não inclui suporte às aulas nem acesso ao conteúdo do curso.",
  },
  vip: {
    name: "Comunidade VIP",
    badge: "Só alunos",
    tagline: "Incluída na matrícula do curso",
    perks: [
      `Skills premium liberadas após ${PRICING.guaranteeDays} dias da compra`,
      "Dúvidas sobre as aulas respondidas no grupo",
      "Networking com quem já aplica Claude no escritório",
      "Materiais extras e atualizações antes do público",
    ],
    note: `Grupo VIP na matrícula. Skills premium após ${PRICING.guaranteeDays} dias.`,
  },
} as const;
