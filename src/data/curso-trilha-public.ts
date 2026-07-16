/** Conteúdo público da trilha — sem roteiro detalhado (aulas ficam internas). */

export const TRILHA_PUBLIC_META = {
  kicker: "Sneak peek da trilha",
  title: "O que você vai percorrer",
  subtitle:
    "Organizado por tarefa do escritório, do básico ao avançado. O roteiro completo fica na área de membros.",
  duration: "8 módulos · 32 aulas",
  format: "Screencast · direto ao ponto",
  release: "Liberadas aos poucos",
} as const;

/** Escopo total planejado do curso — usado no copy da oferta. */
export const COURSE_SCOPE = { modules: 8, lessons: 32 } as const;

export type TrilhaNivelPublic = {
  /** Rótulo curto exibido no marcador da timeline */
  level: string;
  title: string;
  teaser: string;
  /** Conteúdo premium — exibido borrado com cadeado para gerar curiosidade */
  premium?: boolean;
};

export const TRILHA_NIVEIS_PUBLIC: TrilhaNivelPublic[] = [
  {
    level: "0",
    title: "Comece aqui",
    teaser: "O que é o Claude, a Anthropic, Claude vs ChatGPT e qual plano escolher",
  },
  {
    level: "1",
    title: "Fundação prática",
    teaser: "Assinatura, privacidade (OAB), os 3 modos e a anatomia do prompt jurídico",
  },
  {
    level: "2",
    title: "Economia do Claude",
    teaser: "Tokens em linguagem de advogado, input vs output e o ROI do seu tempo",
  },
  {
    level: "3",
    title: "Projects",
    teaser: "Montando o Project “Meu Escritório” e Projects por área de atuação",
  },
  {
    level: "4",
    title: "Cowork",
    teaser:
      "4 demos ao vivo: organizar pasta caótica, extrair dados pra planilha, minuta recorrente e briefing semanal automático",
    premium: true,
  },
  {
    level: "5",
    title: "Escritório no automático",
    teaser:
      "Os 5 fluxos que todo escritório deveria automatizar e Chat Jurídico + Claude integrados na prática",
    premium: true,
  },
  {
    level: "6",
    title: "Artefatos",
    teaser:
      "Calculadora trabalhista do zero, Live Artifacts com IA por dentro e triagem inicial de cliente",
    premium: true,
  },
  {
    level: "7",
    title: "Encerramento",
    teaser: "Plano de ação de 30 dias, certificado e próximos passos",
  },
];
