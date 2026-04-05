export interface Option {
  label: string;
  points: number;
}

export interface Question {
  id: number;
  question: string;
  subtitle?: string;
  options: Option[];
}

export const questions: Question[] = [
  {
    id: 1,
    question: "Como você usa IA no seu dia a dia de trabalho?",
    subtitle: "Seja honesto — não tem resposta errada.",
    options: [
      { label: "Não uso IA no trabalho", points: 0 },
      { label: "Uso o ChatGPT de vez em quando pra tirar dúvidas", points: 1 },
      { label: "Uso Claude, ChatGPT ou Gemini com frequência", points: 2 },
      {
        label: "Tenho fluxos automatizados com IA integrada ao meu trabalho",
        points: 3,
      },
    ],
  },
  {
    id: 2,
    question: "Qual dessas ferramentas você conhece?",
    subtitle: "Marque a mais avançada que você já usou ou ouviu falar.",
    options: [
      { label: "Só conheço o ChatGPT", points: 0 },
      { label: "Conheço Claude, Gemini e Copilot", points: 1 },
      { label: "Uso Cursor, Claude Code ou ferramentas com agentes", points: 2 },
      {
        label: "Sei o que é MCP, function calling e conecto IA a sistemas reais",
        points: 3,
      },
    ],
  },
  {
    id: 3,
    question: "O que são agentes de IA?",
    options: [
      { label: "Não sei o que é", points: 0 },
      { label: "Acho que são chatbots mais inteligentes", points: 1 },
      {
        label: "São IAs que executam tarefas de forma autônoma, passo a passo",
        points: 2,
      },
      {
        label:
          "São sistemas que planejam, usam ferramentas e tomam decisões com pouca supervisão",
        points: 3,
      },
    ],
  },
  {
    id: 4,
    question:
      "Você precisa revisar um contrato de 80 páginas. O que faz?",
    subtitle: "Pense no que faria hoje, não no ideal.",
    options: [
      { label: "Leio tudo manualmente, cláusula por cláusula", points: 0 },
      { label: "Copio trechos no ChatGPT e peço pra resumir", points: 1 },
      {
        label: "Subo o documento inteiro num modelo com janela de contexto grande",
        points: 2,
      },
      {
        label:
          "Uso um agente que lê o contrato, compara com um template e lista as divergências",
        points: 3,
      },
    ],
  },
  {
    id: 5,
    question: "Como você lida com tarefas repetitivas no escritório?",
    subtitle: "Follow-ups, relatórios, atualizações de caso…",
    options: [
      { label: "Faço tudo na mão, uma por uma", points: 0 },
      { label: "Uso modelos prontos e copiar/colar", points: 1 },
      {
        label: "Tenho algumas automações (Zapier, Make, macros)",
        points: 2,
      },
      {
        label:
          "Uso IA pra gerar, classificar e disparar automaticamente",
        points: 3,
      },
    ],
  },
  {
    id: 6,
    question: "Enquanto você dorme, a IA do seu escritório está…",
    subtitle: "Agentes de IA podem rodar 24h. Isso já é realidade pra você?",
    options: [
      { label: "Dormindo também — não tenho nada automatizado", points: 0 },
      {
        label: "Tenho e-mails agendados, mas nada inteligente",
        points: 1,
      },
      {
        label: "Tenho automações que disparam sem eu precisar intervir",
        points: 2,
      },
      {
        label:
          "Tenho agentes que monitoram, classificam e respondem sozinhos — inclusive de madrugada",
        points: 3,
      },
    ],
  },
  {
    id: 7,
    question: "Em 2026, o que está mudando de verdade na IA?",
    subtitle: "Essa é pra testar se você está acompanhando.",
    options: [
      { label: "Não sei, não tenho acompanhado", points: 0 },
      { label: "Os modelos ficaram melhores, mas pra mim é tudo igual", points: 1 },
      {
        label: "Agentes de IA já escrevem código, pesquisam e executam tarefas sozinhos",
        points: 2,
      },
      {
        label:
          "MCP virou padrão, agentes rodam por horas sem supervisão e IA já opera dentro de sistemas reais",
        points: 3,
      },
    ],
  },
];

export const maxScore = questions.length * 3;

export interface Result {
  level: string;
  title: string;
  description: string;
  emoji: string;
}

export function getResult(score: number): Result {
  const pct = score / maxScore;

  if (pct <= 0.25) {
    return {
      level: "Iniciante",
      title: "Você está no ponto de partida",
      description:
        "Sem drama: a maioria dos escritórios ainda não usa IA direito. Mas quem começa agora já sai na frente. O mini curso foi feito pra quem está nesse ponto — em poucos dias você já vai estar usando IA de verdade no trabalho.",
      emoji: "🌱",
    };
  }

  if (pct <= 0.5) {
    return {
      level: "Explorador",
      title: "Você já experimentou, mas está subutilizando",
      description:
        "Você já mexe com IA, mas usa uma fração do que dá pra fazer. A maioria dos advogados está aqui. O próximo passo é aprender prompts pra advocacia e montar fluxos que economizam horas de verdade.",
      emoji: "🔍",
    };
  }

  if (pct <= 0.75) {
    return {
      level: "Praticante",
      title: "Você está acima da média do mercado",
      description:
        "Você já usa IA com frequência e entende o que está acontecendo. O que falta é integrar ferramentas, usar agentes e criar automações que rodam sozinhas. O curso avançado cobre exatamente isso.",
      emoji: "⚡",
    };
  }

  return {
    level: "Avançado",
    title: "Você é referência no seu escritório",
    description:
      "Pouca gente no jurídico está nesse nível. Você já entende agentes, MCP e automação de verdade. A comunidade no WhatsApp é pra trocar com quem está no mesmo patamar — e o curso tem conteúdo avançado que vale a pena.",
    emoji: "🚀",
  };
}
