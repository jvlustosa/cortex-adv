export const BRAND_NAME = "Claude Academy";
export const BRAND_BYLINE = "by Chat Jurídico";
export const BRAND_FULL = `${BRAND_NAME} ${BRAND_BYLINE}`;

/** Logo oficial — mesma imagem do hub Claude no website Chat Jurídico */
export const BRAND_LOGO_SRC =
  "/assets/images/claude-hub/claude-para-advogados-academy.png";
export const BRAND_LOGO_ALT = "Claude Academy: Claude para Advogados";

export const BRAND_DOMAIN = "claudeacademy.chatjuridico.com.br";

export const BRAND_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  `https://${BRAND_DOMAIN}`;

export const CHAT_JURIDICO_URL =
  "https://chatjuridico.com.br?utm_source=claude_academy&utm_medium=referral";
