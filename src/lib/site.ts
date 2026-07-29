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

/** Lista de espera — /api/waitlist encaminha p/ o endpoint do site (WAITLIST_FORWARD_URL). */
export const WAITLIST_API_URL =
  process.env.NEXT_PUBLIC_WAITLIST_API_URL ?? "/api/waitlist";

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

/** Grupo Exclusivo (Comunidade VIP) no WhatsApp: fechado, só alunos. */
export const VIP_WHATSAPP_GROUP_URL =
  process.env.NEXT_PUBLIC_VIP_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/GLeGCIvaUk6KRTkEXA85BG";

export const COMMUNITY = {
  open: {
    name: "Grupo aberto",
    badge: "Grátis",
    tagline: "Qualquer advogado pode entrar",
    perks: [
      "Dicas de prompt e novidades do Claude Academy",
      "Troca informal entre advogados curiosos com IA",
      "Avisos de aulas novas e materiais liberados",
    ],
    note: "Não inclui suporte às aulas nem acesso ao conteúdo do curso.",
  },
  vip: {
    name: "Comunidade VIP",
    badge: "Só alunos",
    tagline: "Fechada para garantir troca de alto nível",
    /** Já incluso na matrícula — o que o aluno encontra no grupo hoje. */
    perks: [
      "Acesso à comunidade por 1 ano",
      "Dúvidas sobre as aulas respondidas no grupo",
      "Networking com quem já aplica Claude no escritório",
    ],
    /** Ainda não liberado — bloco "sendo preparado" pra sinalizar que a comunidade cresce. */
    comingSoon: [
      `Skills premium (após ${PRICING.guaranteeDays} dias de garantia)`,
      "Pack de conectores pro Claude no escritório",
      "Materiais extras e atualizações antes do público",
      "Novas aulas e lives só pra alunos",
      "Templates e playbooks prontos pra copiar",
    ],
    note: "Grupo VIP na matrícula. O resto está sendo preparado. O aluno tem acesso a tudo que for liberado no ano.",
  },
} as const;
