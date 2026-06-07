/** Conteúdo público da trilha — sem roteiro detalhado (aulas ficam internas). */

export const TRILHA_PUBLIC_META = {
  kicker: "Sneak peek da trilha",
  title: "O que você vai percorrer",
  subtitle:
    "Organizado por tarefa jurídica, do básico ao avançado. O roteiro completo fica na área de membros.",
  duration: "≈ 3h em microaulas",
  format: "Screencast · 4–5 min por aula",
} as const;

export type TrilhaNivelPublic = {
  level: string;
  title: string;
  teaser: string;
};

export const TRILHA_NIVEIS_PUBLIC: TrilhaNivelPublic[] = [
  {
    level: "0",
    title: "Fundamentos e Segurança",
    teaser: "Ética, sigilo, LGPD e a regra de ouro da advocacia com IA",
  },
  {
    level: "1",
    title: "Prompting Jurídico",
    teaser: "Anatomia do prompt, iteração e biblioteca inicial",
  },
  {
    level: "2",
    title: "Trabalho com Documentos",
    teaser: "PDFs, contratos, artifacts e casos práticos",
  },
  {
    level: "3",
    title: "Projects e Memória",
    teaser: "Contexto do escritório e continuidade por caso",
  },
  {
    level: "4",
    title: "Pesquisa e Jurisprudência",
    teaser: "Pesquisa assistida com validação na fonte oficial",
  },
  {
    level: "5",
    title: "Skills",
    teaser: "Habilidades plugáveis e capstone do escritório",
  },
];
