// Manifesto dos packs inclusos no curso. Estático: a entrega das skills continua
// nos materiais de cada aula; aqui os packs só são apresentados e agrupados na
// área de membros (/area-de-membros/packs). O acesso é liberado após a garantia
// — ver src/lib/course/packs-access.ts.

export type PackIconKey = "skills" | "conectores";

/** Item entregue como conector MCP remoto: o aluno cola a URL no Claude. */
export type RemoteConnectorItem = {
  kind: "remote-connector";
  name: string;
  description: string;
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
};

export type PackItem = RemoteConnectorItem | LessonRefItem;

export type Pack = {
  id: string;
  icon: PackIconKey;
  title: string;
  tagline: string;
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
      "Skills jurídicas prontas, instaláveis direto no seu Claude. Ficam nos materiais de cada aula.",
    items: [
      {
        kind: "lesson-ref",
        name: "Triagem de caso",
        description: "Classifica a demanda e sugere o encaminhamento no seu formato.",
      },
      {
        kind: "lesson-ref",
        name: "Minuta",
        description: "Rascunha a peça a partir dos fatos, no padrão do escritório.",
      },
      {
        kind: "lesson-ref",
        name: "Análise de contrato",
        description: "Levanta cláusulas de risco e pontos de atenção do contrato.",
      },
    ],
  },
  {
    id: "conectores",
    icon: "conectores",
    title: "Pack de Conectores",
    tagline:
      "Conectores que ligam o Claude aos sistemas do dia a dia — sem sair da conversa.",
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
    ],
  },
];
