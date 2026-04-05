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

/** Ordem: do mais concreto e acessível (início) ao mais técnico e de mercado (final). */
export const questions: Question[] = [
  {
    id: 1,
    question: "Onde a IA entra no seu fluxo de trabalho hoje?",
    subtitle: "Pergunta direta: pense no seu dia a dia no escritório.",
    options: [
      { label: "Quase não uso (ainda é exceção no meu dia a dia)", points: 0 },
      { label: "Uso pontualmente pra dúvidas, rascunhos ou resumos", points: 1 },
      {
        label: "Uso Claude, ChatGPT ou Gemini com frequência no trabalho",
        points: 2,
      },
      {
        label:
          "Fluxos com IA integrada: rotina, templates, automação ou orquestração",
        points: 3,
      },
    ],
  },
  {
    id: 2,
    question:
      "Você precisa revisar um contrato de 80 páginas. O que faz na prática?",
    subtitle: "Cenário concreto: o que você faria hoje, sem julgar.",
    options: [
      { label: "Leitura integral manual (ainda é o padrão pra mim)", points: 0 },
      {
        label: "Vou por partes no chat e peço resumo ou achados por trecho",
        points: 1,
      },
      {
        label:
          "Envio o PDF inteiro pra modelo com janela grande e peço mapa de riscos ou cláusulas",
        points: 2,
      },
      {
        label:
          "Workflow com comparação a base, checklist ou agente que cruza com modelo interno",
        points: 3,
      },
    ],
  },
  {
    id: 3,
    question:
      "Geração de peças (petições, manifestações, documentos no processo): como você faz hoje?",
    subtitle:
      "Rotina real: quem redige, se usa IA e em que nível (não o que seria ideal).",
    options: [
      {
        label:
          "Não redijo peças no meu papel (outro foco, outro cargo ou não atuo nisso)",
        points: 0,
      },
      {
        label:
          "Quem redige é outro advogado ou equipe; eu oriento, reviso ou só aprovo",
        points: 1,
      },
      {
        label:
          "Redijo eu mesmo, com IA só de vez em quando ou sem processo fixo",
        points: 2,
      },
      {
        label:
          "Uso IA com frequência no fluxo de peças (modelos, prompts, revisão iterativa)",
        points: 3,
      },
    ],
  },
  {
    id: 4,
    question:
      "Follow-up, status de processo, relatório semanal: o que roda sozinho?",
    subtitle: "Quanto menos depender de você lembrar, melhor o patamar.",
    options: [
      { label: "Tudo depende de mim lembrar e executar", points: 0 },
      {
        label: "Templates e copy/paste (ganho tempo, mas sem inteligência)",
        points: 1,
      },
      {
        label: "Automações clássicas (Make, Zapier, macros, regras no e-mail)",
        points: 2,
      },
      {
        label:
          "IA classifica, redige ou dispara etapas com regras que eu defini",
        points: 3,
      },
    ],
  },
  {
    id: 5,
    question:
      "Pesquisa de jurisprudência, súmulas ou doutrina: como você faz na prática?",
    subtitle:
      "Eixo diferente de automação de e-mail: é sobre achar fundamento e precedentes.",
    options: [
      {
        label:
          "Consulto sites de tribunais ou busco manualmente, sem método fixo",
        points: 0,
      },
      {
        label:
          "Google, PDFs de jurisprudência e copiar trecho (sem ferramenta única)",
        points: 1,
      },
      {
        label:
          "Uso IA de vez em quando para resumir, filtrar ou sugerir caminhos de busca",
        points: 2,
      },
      {
        label:
          "Fluxo com IA ou base paga + critério de conferir fonte e citação",
        points: 3,
      },
    ],
  },
  {
    id: 6,
    question: "Até onde vai o seu kit de ferramentas hoje?",
    subtitle: "A partir daqui entram nomes de ferramentas e integração.",
    options: [
      { label: "Uso sobretudo um chat genérico (ex.: só ChatGPT)", points: 0 },
      {
        label: "Alterno entre vários modelos (Claude, Gemini, Copilot, etc.)",
        points: 1,
      },
      {
        label: "Uso IDEs com IA, agentes de código ou fluxos multi-etapa",
        points: 2,
      },
      {
        label:
          "MCP, APIs, function calling (conecto modelo a dados e sistemas reais)",
        points: 3,
      },
    ],
  },
  {
    id: 7,
    question: "Na prática, o que distingue um agente de IA de um chat comum?",
    subtitle: "Conceito mais fino: marque a definição que mais combina com você.",
    options: [
      { label: "Ainda não tenho definição clara na cabeça", points: 0 },
      {
        label: "É um modelo que responde com mais contexto ou memória",
        points: 1,
      },
      {
        label:
          "É uma IA que executa sequências de passos, com ferramentas e feedback",
        points: 2,
      },
      {
        label:
          "Planeja, chama ferramentas, itera e age com supervisão mínima quando bem configurado",
        points: 3,
      },
    ],
  },
  {
    id: 8,
    question: "Em 2026, onde está o salto em relação a “só um chat melhor”?",
    subtitle: "Visão de mercado (a mais exigente do quiz).",
    options: [
      { label: "Não acompanho de perto (notícias soltas)", points: 0 },
      {
        label: "Modelos melhores, mas minha rotina ainda é manual",
        points: 1,
      },
      {
        label:
          "Agentes com ferramentas e tarefas longas já são comuns em produtos que uso",
        points: 2,
      },
      {
        label:
          "MCP, orquestração de agentes e IA em ERP ou código (isso já orienta decisões minhas)",
        points: 3,
      },
    ],
  },
];

export const maxScore = questions.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.points)),
  0,
);

export interface Result {
  level: string;
  title: string;
  description: string;
  emoji: string;
}

export function getResult(score: number): Result {
  const pct = score / maxScore;

  if (pct <= 0.2) {
    return {
      level: "Em transição",
      title: "Você sabe o que existe, mas ainda não incorporou",
      description:
        "Pra quem já ouviu falar de IA no mercado, esse é o lugar de virar intenção em rotina: prompts consistentes, documentos inteiros no modelo e um fluxo que não dependa só de você lembrar. O mini curso puxa isso do zero ao uso sério no escritório.",
      emoji: "🌱",
    };
  }

  if (pct <= 0.44) {
    return {
      level: "Explorador sólido",
      title: "Você usa, mas ainda no improviso",
      description:
        "Você já está na IA no dia a dia; o que falta é padronizar: mesma qualidade todo dia, menos retrabalho, mais automação leve. É o degrau antes de agente e integração (e é onde a maioria dos escritórios poderia estar em meses).",
      emoji: "🔍",
    };
  }

  if (pct <= 16 / maxScore) {
    return {
      level: "Praticante forte",
      title: "Você está à frente da média do jurídico",
      description:
        "Contexto grande, ferramentas e alguma automação já fazem parte. O próximo passo é fechar o ciclo: agentes, orquestração e IA acoplada aos seus sistemas (sem gambiarra). O material avançado do curso mira exatamente nisso.",
      emoji: "⚡",
    };
  }

  return {
    level: "Referência",
    title: "Você está no topo do que o mercado faz hoje",
    description:
      "Poucos escritórios chegam aqui: agentes, MCP, integração real. Você não está só “usando IA” (está desenhando como ela entra na operação). A comunidade no WhatsApp serve pra trocar com quem está nesse patamar; ainda assim dá pra refinar fluxo e governança.",
    emoji: "🚀",
  };
}
