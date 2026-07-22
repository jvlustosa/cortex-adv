export const TOK_PAGE = 600;
export const NEWTOK = 1.3;

export type EffortLevel = "low" | "medium" | "high" | "xhigh" | "max";

export const EFFORT: Record<EffortLevel, number> = {
  low: 0.5,
  medium: 0.75,
  high: 1,
  xhigh: 1.5,
  max: 2,
};

export type ModelId = "haiku" | "sonnet5" | "s46" | "opus" | "fable";

export interface ClaudeModel {
  id: ModelId;
  name: string;
  tag: string;
  inP: number;
  outP: number;
  ntk: boolean;
  hot?: boolean;
  optional?: boolean;
}

export const MODELS: ClaudeModel[] = [
  {
    id: "haiku",
    name: "Haiku 4.5",
    tag: "volume",
    inP: 1,
    outP: 5,
    ntk: false,
  },
  {
    id: "sonnet5",
    name: "Sonnet 5",
    tag: "intro até 31/ago",
    inP: 2,
    outP: 10,
    ntk: true,
    hot: true,
  },
  {
    id: "s46",
    name: "Sonnet 4.6",
    tag: "geração anterior",
    inP: 3,
    outP: 15,
    ntk: false,
    optional: true,
  },
  {
    id: "opus",
    name: "Opus 4.8",
    tag: "premium",
    inP: 5,
    outP: 25,
    ntk: true,
  },
  {
    id: "fable",
    name: "Fable 5",
    tag: "topo de linha",
    inP: 10,
    outP: 50,
    ntk: true,
  },
];

export type PresetId = "triagem" | "peticao" | "parecer" | "autos";

export const PRESETS: Record<PresetId, { i: number; o: number; label: string; pk: string }> =
  {
    triagem: {
      pk: "Volume",
      label: "Triagem de mensagem — 2 pgs in · ½ pg out",
      i: 2,
      o: 1,
    },
    peticao: {
      pk: "Produção",
      label: "Petição — 40 pgs de autos · 12 pgs de peça",
      i: 40,
      o: 12,
    },
    parecer: {
      pk: "Consultivo",
      label: "Parecer — 80 pgs · 15 pgs de análise",
      i: 80,
      o: 15,
    },
    autos: {
      pk: "Contexto longo",
      label: "Análise de autos — 500 pgs · 20 pgs",
      i: 500,
      o: 20,
    },
  };

export interface CostBreakdown {
  inT: number;
  outT: number;
  inCost: number;
  outCost: number;
  total: number;
}

export interface SimulatorOptions {
  batch: boolean;
  cache: boolean;
  postSeptember: boolean;
  compareSonnet46: boolean;
  effort: EffortLevel;
}

export function fmtUsd(v: number): string {
  if (v >= 100) return `US$ ${v.toFixed(0)}`;
  if (v >= 1) return `US$ ${v.toFixed(2)}`;
  return `US$ ${v.toFixed(3)}`;
}

export function fmtK(t: number): string {
  if (t >= 1e6) return `${(t / 1e6).toFixed(2)} mi`;
  return `${Math.round(t / 1000)} mil`;
}

export function computeCost(
  model: ClaudeModel,
  pgIn: number,
  pgOut: number,
  options: SimulatorOptions,
): CostBreakdown {
  const f = model.ntk ? NEWTOK : 1;
  const inT = pgIn * TOK_PAGE * f;
  const outT = pgOut * TOK_PAGE * f * EFFORT[options.effort];

  let inP = model.inP;
  let outP = model.outP;

  if (model.id === "sonnet5" && options.postSeptember) {
    inP = 3;
    outP = 15;
  }

  if (options.batch) {
    inP *= 0.5;
    outP *= 0.5;
  }

  const inCost = options.cache
    ? (inT * 0.3 * inP + inT * 0.7 * inP * 0.1) / 1e6
    : (inT * inP) / 1e6;

  const outCost = (outT * outP) / 1e6;

  return { inT, outT, inCost, outCost, total: inCost + outCost };
}

export const SIMULATOR_FAQ = [
  {
    question: "Quanto custa usar Claude para advogados?",
    answer:
      "Depende do modelo, do volume de páginas lidas e geradas e de descontos como Batch API e cache. Este simulador usa preços oficiais por milhão de tokens (MTok) em USD — Sonnet 5, por exemplo, começa em US$ 2 entrada / US$ 10 saída no período introdutório.",
  },
  {
    question: "O que é MTok e como converter páginas em tokens?",
    answer:
      "MTok significa milhão de tokens. Como regra didática, usamos cerca de 600 tokens por página jurídica. Modelos com tokenizador novo (Sonnet 5, Opus 4.8, Fable 5) consomem cerca de 30% mais tokens para o mesmo texto.",
  },
  {
    question: "Batch API e cache reduzem quanto?",
    answer:
      "Batch API aplica −50% em entrada e saída para rotinas sem pressa. Cache de contexto repetido (skills, timbrado, instruções fixas) cobra 70% do input a 0,1× e 30% a preço cheio — útil quando o mesmo contexto entra em centenas de requisições.",
  },
  {
    question: "Qual modelo Claude usar no escritório?",
    answer:
      "Haiku 4.5 para triagem e volume; Sonnet 5 para produção de peças e análises do dia a dia; Opus 4.8 ou Fable 5 quando a complexidade ou a qualidade máxima justificam o custo. O simulador compara todos lado a lado na mesma tarefa.",
  },
] as const;
