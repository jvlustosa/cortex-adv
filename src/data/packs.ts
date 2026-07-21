// Manifesto da Galeria Premium. Estático: a entrega das skills continua nos
// materiais de cada aula; conectores remotos têm URL + passos. Teasers
// (`status: "teaser"`) aparecem na galeria com badge "Sendo preparado".
// Acesso liberado após a garantia — ver src/lib/course/packs-access.ts.

export type PackIconKey = "skills" | "conectores";

export type PackItemStatus = "ready" | "teaser";

/** Item entregue como conector MCP remoto: o aluno cola a URL no Claude. */
export type RemoteConnectorItem = {
  kind: "remote-connector";
  name: string;
  description: string;
  status?: PackItemStatus;
  /** URL do conector remoto adicionada nas configurações do Claude. */
  connectorUrl: string;
  /** Passos de setup no Claude, na ordem. */
  setupSteps: string[];
};

/** Item que vive dentro das aulas (skills baixáveis nos materiais). */
export type LessonRefItem = {
  kind: "lesson-ref";
  name: string;
  description: string;
  status?: PackItemStatus;
  /** Deep-link pra aula onde a skill aparece nos materiais. */
  moduleId?: string;
  lessonId?: string;
};

export type PackItem = RemoteConnectorItem | LessonRefItem;

export type Pack = {
  id: string;
  icon: PackIconKey;
  title: string;
  tagline: string;
  /** Tags curtas estilo galeria CJ (ex.: Triagem, Contratos). */
  tags: string[];
  items: PackItem[];
};

// TODO(vitor): trocar pela URL real do conector remoto do DJEN.
export const DJEN_CONNECTOR_URL_PLACEHOLDER =
  "https://conector-djen.exemplo.chatjuridico.com.br/mcp";

export const PACKS: Pack[] = [
  {
    id: "skills",
    icon: "skills",
    title: "Pack de Skills",
    tagline:
      "Skills jurídicas prontas, instaláveis no Claude. Parte nos materiais das aulas; o resto está sendo preparado.",
    tags: ["Triagem", "Peças", "Contratos", "Atendimento"],
    items: [
      {
        kind: "lesson-ref",
        name: "Triagem de caso",
        description:
          "Classifica a demanda e sugere o encaminhamento no seu formato.",
        moduleId: "skills",
        lessonId: "introducao-skills",
      },
      {
        kind: "lesson-ref",
        name: "Minuta",
        description:
          "Rascunha a peça a partir dos fatos, no padrão do escritório.",
        moduleId: "skills",
        lessonId: "prompts-vs-skills",
      },
      {
        kind: "lesson-ref",
        name: "Análise de contrato",
        description:
          "Levanta cláusulas de risco e pontos de atenção do contrato.",
        moduleId: "skills",
        lessonId: "verificar-seguranca-skills",
      },
      {
        kind: "lesson-ref",
        name: "Follow-up inteligente",
        description: "Roteiros de retorno e pós-venda no WhatsApp do escritório.",
        status: "teaser",
        moduleId: "skills",
        lessonId: "navegacao-e-skills",
      },
      {
        kind: "lesson-ref",
        name: "Pesquisa de jurisprudência",
        description: "Busca e sintetiza precedentes no formato do seu caso.",
        status: "teaser",
        moduleId: "skills",
        lessonId: "gerenciar-compartilhar-skills",
      },
      {
        kind: "lesson-ref",
        name: "Gestão de prazos",
        description: "Checklist e alertas de prazo a partir do contexto do caso.",
        status: "teaser",
      },
    ],
  },
  {
    id: "conectores",
    icon: "conectores",
    title: "Pack de Conectores",
    tagline:
      "Conectores que ligam o Claude aos sistemas do dia a dia — sem sair da conversa.",
    tags: ["DJEN", "MCP", "Escritório"],
    items: [
      {
        kind: "remote-connector",
        name: "Conector de Publicações do DJEN",
        description:
          "Consulta publicações e intimações do Diário de Justiça Eletrônico Nacional direto do Claude — por OAB ou nome.",
        connectorUrl: DJEN_CONNECTOR_URL_PLACEHOLDER,
        setupSteps: [
          "No Claude, abra Configurações → Conectores.",
          "Escolha adicionar um conector remoto e cole a URL acima.",
          "Autorize o acesso quando o Claude pedir.",
          "Peça as publicações do dia por OAB ou nome do advogado.",
        ],
      },
      {
        kind: "remote-connector",
        name: "Conector Chat Jurídico CRM",
        description:
          "Puxa contatos e status de atendimento do CRM pro Claude Cowork.",
        status: "teaser",
        connectorUrl: "https://conector-crm.exemplo.chatjuridico.com.br/mcp",
        setupSteps: [
          "No Claude, abra Configurações → Conectores.",
          "Adicione o conector remoto com a URL liberada.",
          "Autorize o acesso ao CRM do escritório.",
        ],
      },
      {
        kind: "remote-connector",
        name: "Conector de prazos processuais",
        description:
          "Consulta prazos e movimentações a partir do número do processo.",
        status: "teaser",
        connectorUrl: "https://conector-prazos.exemplo.chatjuridico.com.br/mcp",
        setupSteps: [
          "No Claude, abra Configurações → Conectores.",
          "Adicione o conector remoto com a URL liberada.",
          "Peça o prazo do processo pelo número CNJ.",
        ],
      },
    ],
  },
];

export function countPackItems(packs: Pack[]): {
  total: number;
  ready: number;
  teasers: number;
} {
  let ready = 0;
  let teasers = 0;
  for (const pack of packs) {
    for (const item of pack.items) {
      if (item.status === "teaser") teasers += 1;
      else ready += 1;
    }
  }
  return { total: ready + teasers, ready, teasers };
}

export function lessonHref(item: LessonRefItem): string | null {
  if (!item.moduleId || !item.lessonId) return null;
  return `/aulas/${item.moduleId}/${item.lessonId}`;
}
