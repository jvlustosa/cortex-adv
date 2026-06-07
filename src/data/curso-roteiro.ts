/**
 * Roteiro interno — não exportar em páginas públicas.
 * Site público usa curso-trilha-public.ts (sneak peek).
 * Área de membros e seed Supabase usam este arquivo.
 */

export type AulaBadge = "gratis" | "ancora" | "entregavel" | "capstone";

export type CursoAula = {
  id: string;
  title: string;
  objective: string;
  minutes: number;
  badge?: AulaBadge;
};

export type CursoNivel = {
  id: string;
  level: number | "bonus";
  title: string;
  subtitle?: string;
  aulas: CursoAula[];
};

export const CURSO_META = {
  title: "Claude para Advogados",
  tagline:
    "Claude para a advocacia brasileira — com skills, padrões de peça e disciplina ética.",
  aulas: 35,
  duration: "2h45–3h",
  format: "Vídeo gravado (screencast)",
  lessonDuration: "4–5 min por aula",
  depth: "Do básico ao avançado — teto em Skills",
  philosophy:
    "Organizado por tarefa jurídica, não por recurso. Cada ferramenta aparece quando resolve uma dor real do escritório.",
  threads: [
    "Disciplina antialucinação — exigir fonte, mandar verificar, não invente.",
    "Sigilo, LGPD e ética — o advogado assina e responde; revisão humana inegociável.",
  ],
  tracks: {
    rapida: "Níveis 0–3 — produtividade imediata",
    completa: "Até Nível 5 — Skills como diferencial e certificado",
  },
} as const;

export const CURSO_NIVEIS: CursoNivel[] = [
  {
    id: "n0",
    level: 0,
    title: "Fundamentos e Segurança",
    subtitle: "Aulas 0.1 e 0.2 liberadas como amostra grátis",
    aulas: [
      {
        id: "0.1",
        title: "Boas-vindas",
        objective: "Mapa do curso, caso-fio-condutor e biblioteca de prompts",
        minutes: 3,
        badge: "gratis",
      },
      {
        id: "0.2",
        title: "O que o Claude é e o que ele não é",
        objective: 'Modelo de linguagem; por que ele "inventa" com confiança',
        minutes: 5,
        badge: "gratis",
      },
      {
        id: "0.3",
        title: "Acesso, planos e interface",
        objective: "A interface em cinco minutos",
        minutes: 5,
      },
      {
        id: "0.4",
        title: "Sigilo, LGPD e ética OAB",
        objective:
          "O que pode entrar numa conversa, dados de cliente, dever de revisão",
        minutes: 5,
        badge: "ancora",
      },
      {
        id: "0.5",
        title: "A regra de ouro",
        objective: "Você assina, você responde",
        minutes: 4,
      },
    ],
  },
  {
    id: "n1",
    level: 1,
    title: "Prompting Jurídico",
    subtitle: "O coração do curso — ≈ 80% do valor",
    aulas: [
      {
        id: "1.1",
        title: "Anatomia de um prompt que funciona",
        objective: "Papel + contexto + tarefa + formato + restrição",
        minutes: 5,
      },
      {
        id: "1.2",
        title: "Seu primeiro pedido de peça",
        objective: "O briefing que muda o resultado",
        minutes: 5,
      },
      {
        id: "1.3",
        title: "Pedindo do jeito certo",
        objective: "Parecer, análise e resumo",
        minutes: 5,
      },
      {
        id: "1.4",
        title: "Iterar e refinar",
        objective: "Por que a 1ª resposta nunca é a final",
        minutes: 5,
      },
      {
        id: "1.5",
        title: "Domando a alucinação",
        objective: 'Exigir fonte, mandar verificar, "não invente"',
        minutes: 5,
      },
      {
        id: "1.6",
        title: "Ensinando seu estilo ao Claude",
        objective: "Tom, formatação, padrões de redação",
        minutes: 4,
      },
      {
        id: "1.7",
        title: "Os 10 prompts da semana",
        objective: "Biblioteca inicial de prompts",
        minutes: 5,
        badge: "entregavel",
      },
    ],
  },
  {
    id: "n2",
    level: 2,
    title: "Trabalho com Documentos",
    aulas: [
      {
        id: "2.1",
        title: "Subindo documentos",
        objective: "PDFs de processo, contratos, decisões",
        minutes: 4,
      },
      {
        id: "2.2",
        title: "Lendo e resumindo autos extensos",
        objective: "Sem perder o ponto",
        minutes: 5,
      },
      {
        id: "2.3",
        title: "Análise de contrato profissional",
        objective: "Cláusula integral → risco → sugestão substitutiva",
        minutes: 5,
      },
      {
        id: "2.4",
        title: "Gerando arquivos prontos",
        objective: "Word, Excel e PDF",
        minutes: 5,
      },
      {
        id: "2.5",
        title: "Artifacts",
        objective: "Peças, planilhas e calculadoras na conversa",
        minutes: 5,
      },
      {
        id: "2.6",
        title: "Caso prático completo",
        objective: "Do PDF bruto à minuta revisável",
        minutes: 5,
      },
    ],
  },
  {
    id: "n3",
    level: 3,
    title: "Projects e Memória",
    aulas: [
      {
        id: "3.1",
        title: "O que é um Project",
        objective: "E por que ele muda tudo",
        minutes: 4,
      },
      {
        id: "3.2",
        title: "Montando o Project do escritório",
        objective: "Conhecimento + instruções",
        minutes: 5,
      },
      {
        id: "3.3",
        title: "Instruções que codificam seu jeito",
        objective: "Padrões de trabalho automatizados",
        minutes: 5,
      },
      {
        id: "3.4",
        title: "Project por caso/cliente",
        objective: "Organização e continuidade",
        minutes: 5,
      },
      {
        id: "3.5",
        title: "Memória e histórico",
        objective: "O Claude que lembra do que importa",
        minutes: 4,
      },
    ],
  },
  {
    id: "n4",
    level: 4,
    title: "Pesquisa e Jurisprudência",
    subtitle: "Com freio de mão",
    aulas: [
      {
        id: "4.1",
        title: "Pesquisa na web com Claude",
        objective: "Quando vale e quando não",
        minutes: 4,
      },
      {
        id: "4.2",
        title: "Jurisprudência assistida",
        objective:
          "O aviso que protege sua OAB: validar sempre na fonte oficial",
        minutes: 5,
      },
      {
        id: "4.3",
        title: "Monitorando temas que você acompanha",
        objective: "Ex.: teses tributárias",
        minutes: 4,
      },
      {
        id: "4.4",
        title: "Os limites",
        objective: "O que nunca terceirizar à IA",
        minutes: 4,
      },
    ],
  },
  {
    id: "n5",
    level: 5,
    title: "Skills",
    subtitle: "O teto e o diferencial do curso",
    aulas: [
      {
        id: "5.1",
        title: "O que é uma Skill",
        objective: "E por que ela industrializa seu escritório",
        minutes: 5,
      },
      {
        id: "5.2",
        title: "Anatomia de uma skill",
        objective: "Quando o Claude a aciona e o que ela carrega",
        minutes: 5,
      },
      {
        id: "5.3",
        title: "Criando sua primeira skill",
        objective: "Modelo de petição padronizado",
        minutes: 5,
      },
      {
        id: "5.4",
        title: "Skill de análise de contrato",
        objective: "No seu formato fixo",
        minutes: 5,
      },
      {
        id: "5.5",
        title: "Mantendo sua biblioteca de skills",
        objective: "Organização e versionamento",
        minutes: 4,
      },
      {
        id: "5.6",
        title: "Capstone",
        objective:
          "Monte seu kit de produção: Project + 3 skills + biblioteca",
        minutes: 5,
        badge: "capstone",
      },
    ],
  },
  {
    id: "bonus",
    level: "bonus",
    title: "Bônus — O que vem depois",
    aulas: [
      {
        id: "B.1",
        title: "Conectores, automação e o escritório que roda sozinho",
        objective: "Gancho para um curso avançado",
        minutes: 4,
      },
    ],
  },
];

export const AULA_FORMATO = [
  { step: 1, label: "Gancho (20s)", desc: "A dor do dia" },
  { step: 2, label: "Conceito (1 min)", desc: "A ideia mínima, sem teoria gratuita" },
  { step: 3, label: "Demonstração (2 min)", desc: "Tela gravada com tarefa jurídica real" },
  { step: 4, label: "Mão na massa (45s)", desc: "Desafio + prompt/template para baixar" },
  { step: 5, label: "Armadilha (15s)", desc: "Erro a evitar — antialucinação ou sigilo" },
] as const;

export function totalAulas(): number {
  return CURSO_NIVEIS.reduce((acc, n) => acc + n.aulas.length, 0);
}

export function totalMinutos(): number {
  return CURSO_NIVEIS.reduce(
    (acc, n) => acc + n.aulas.reduce((a, l) => a + l.minutes, 0),
    0,
  );
}
