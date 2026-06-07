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
    question: "Onde o Claude entra no seu fluxo de trabalho hoje?",
    subtitle: "Pense no seu dia a dia no escritório, não no que seria ideal.",
    options: [
      { label: "Ainda não uso Claude (ou uso IA só de vez em quando)", points: 0 },
      {
        label: "Uso Claude pontualmente pra dúvidas, rascunhos ou resumos",
        points: 1,
      },
      {
        label: "Claude faz parte da rotina: peças, contratos ou análise de docs",
        points: 2,
      },
      {
        label:
          "Cowork, templates e fluxos com Claude integrado à operação do escritório",
        points: 3,
      },
    ],
  },
  {
    id: 2,
    question:
      "Você precisa revisar um contrato de 80 páginas. O que faz com o Claude?",
    subtitle: "Cenário concreto: o que você faria hoje, sem julgar.",
    options: [
      { label: "Leitura integral manual (ainda é o padrão pra mim)", points: 0 },
      {
        label: "Corto em pedaços e vou colando no chat, pedindo resumo por trecho",
        points: 1,
      },
      {
        label:
          "Envio o PDF inteiro pro Claude e peço mapa de riscos, cláusulas ou comparativo",
        points: 2,
      },
      {
        label:
          "Workflow com checklist, comparação a modelo interno ou agente que cruza com base do escritório",
        points: 3,
      },
    ],
  },
  {
    id: 3,
    question:
      "Geração de peças (petições, manifestações, documentos no processo): como você usa o Claude?",
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
          "Redijo eu mesmo, com Claude só de vez em quando ou sem processo fixo",
        points: 2,
      },
      {
        label:
          "Cowork com Claude: briefing, iteração e revisão em ciclo (modelos, prompts, supervisão humana)",
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
          "Claude classifica, redige ou dispara etapas com regras que eu defini",
        points: 3,
      },
    ],
  },
  {
    id: 5,
    question:
      "Pesquisa de jurisprudência, súmulas ou doutrina: como você usa IA na prática?",
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
          "Uso Claude de vez em quando para resumir, filtrar ou sugerir caminhos de busca",
        points: 2,
      },
      {
        label:
          "Fluxo com Claude ou base paga + critério de conferir fonte e citação",
        points: 3,
      },
    ],
  },
  {
    id: 6,
    question: "Na prática, o que distingue o Claude dos outros modelos de IA?",
    subtitle: "ChatGPT, Gemini, Copilot: cada um tem ponto forte. O que você sabe do Claude?",
    options: [
      {
        label: "Pra mim é tudo igual (só um chat que responde)",
        points: 0,
      },
      {
        label: "Sei que o Claude é bom em texto longo, mas uso o que estiver aberto",
        points: 1,
      },
      {
        label:
          "Uso o Claude quando preciso de contexto grande, nuance jurídica ou instruções longas",
        points: 2,
      },
      {
        label:
          "Escolho o modelo por tarefa: Claude pra docs e peças, outros pra código ou busca",
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
          "Planeja, chama ferramentas (MCP, APIs), itera e age com supervisão mínima quando bem configurado",
        points: 3,
      },
    ],
  },
  {
    id: 8,
    question: "Em 2026, onde está o salto do Claude em relação a “só um chat melhor”?",
    subtitle: "Visão de mercado (a mais exigente do quiz).",
    options: [
      { label: "Não acompanho de perto (notícias soltas)", points: 0 },
      {
        label: "Modelos melhores, mas minha rotina ainda é manual",
        points: 1,
      },
      {
        label:
          "Cowork, agentes com ferramentas e tarefas longas já são comuns no que uso",
        points: 2,
      },
      {
        label:
          "MCP, orquestração de agentes e Claude acoplado ao ERP ou código (isso já orienta decisões minhas)",
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
  cta: string;
}

export function getResult(score: number): Result {
  const pct = score / maxScore;

  if (pct <= 0.2) {
    return {
      level: "Em transição",
      title: "Você sabe o que o Claude faz, mas ainda não incorporou",
      description:
        "Pra quem já ouviu falar de IA no mercado, esse é o lugar de virar intenção em rotina: prompts consistentes, documentos inteiros no Claude e um fluxo que não dependa só de você lembrar. O curso puxa isso do zero ao uso sério no escritório.",
      emoji: "🌱",
      cta: "Garantir vaga no curso",
    };
  }

  if (pct <= 0.44) {
    return {
      level: "Explorador sólido",
      title: "Você usa Claude, mas ainda no improviso",
      description:
        "Você já está na IA no dia a dia; o que falta é padronizar: mesma qualidade todo dia, menos retrabalho, mais automação leve. É o degrau antes de Cowork, agente e integração, e é onde a maioria dos escritórios poderia estar em meses.",
      emoji: "🔍",
      cta: "Garantir vaga no curso",
    };
  }

  if (pct <= 16 / maxScore) {
    return {
      level: "Praticante forte",
      title: "Você está à frente da média do jurídico",
      description:
        "Contexto grande, Cowork e alguma automação já fazem parte. O próximo passo é fechar o ciclo: agentes, MCP e Claude acoplado aos seus sistemas (sem gambiarra). O material avançado do curso mira exatamente nisso.",
      emoji: "⚡",
      cta: "Garantir vaga no curso",
    };
  }

  return {
    level: "Referência",
    title: "Você está no topo do que o mercado faz hoje",
    description:
      "Poucos escritórios chegam aqui: agentes, MCP, integração real. Você não está só “usando Claude”; está desenhando como ele entra na operação. A Comunidade VIP serve pra trocar com quem está nesse patamar.",
    emoji: "🚀",
    cta: "Garantir vaga no curso",
  };
}
