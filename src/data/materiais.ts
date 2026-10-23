// Materiais gratuitos (/materiais): apostilas do curso liberadas como isca.
// Os PDFs ficam no bucket privado `free-materials` (sobem com
// `npm run materiais:upload`); a capa é estática em public/. O download passa
// por /api/materiais/download, que assina o arquivo na hora do clique.

export const FREE_MATERIALS_BUCKET = "free-materials";

export type FreeMaterial = {
  /** Usado na URL de download e como chave do arquivo no bucket. */
  id: string;
  volume: string;
  title: string;
  description: string;
  topics: string[];
  pages: number;
  sizeBytes: number;
  /** Caminho do objeto no bucket. */
  filePath: string;
  /** Nome sugerido no download (ASCII, sem espaço). */
  fileName: string;
  cover: string;
};

export const FREE_MATERIALS: FreeMaterial[] = [
  {
    id: "01",
    volume: "Vol. 1",
    title: "Claude para Advogados",
    description:
      "O ponto de partida: o que o Claude é, o que ele não é e como montar o ambiente antes de pedir a primeira peça.",
    topics: [
      "Claude vs. ChatGPT: qual usar em cada tarefa",
      "Qual plano escolher",
      "Segurança do escritório em camadas",
      "Chat, Projetos, Cowork e Chrome",
    ],
    pages: 14,
    sizeBytes: 6_257_530,
    filePath: "apostila-01-claude-para-advogados.pdf",
    fileName: "Claude-Academy-01-Claude-para-Advogados.pdf",
    cover: "/assets/images/materiais/apostila-01.webp",
  },
  {
    id: "02",
    volume: "Vol. 2",
    title: "Configuração & Conferência",
    description:
      "Alucinação sob controle e o Claude configurado do seu jeito, com as instruções que ele lê em toda conversa.",
    topics: [
      "As 4 perguntas antes de assinar",
      "Revisão adversarial",
      "Instruções globais e a palavra INEGOCIÁVEL",
      "Privacidade da conta e memórias",
    ],
    pages: 11,
    sizeBytes: 6_458_486,
    filePath: "apostila-02-configuracao-e-conferencia.pdf",
    fileName: "Claude-Academy-02-Configuracao-e-Conferencia.pdf",
    cover: "/assets/images/materiais/apostila-02.webp",
  },
  {
    id: "03",
    volume: "Vol. 3",
    title: "Conectores & Skills",
    description:
      "Como ligar o Claude ao e-mail, à agenda e a outros apps, e como instalar skills sem abrir brecha no escritório.",
    topics: [
      "O que cada conector faz",
      "Permissões por conversa",
      "Segurança antes de instalar uma skill",
      "Gerenciar, compartilhar e atualizar skills",
    ],
    pages: 10,
    sizeBytes: 6_284_309,
    filePath: "apostila-03-conectores-e-skills.pdf",
    fileName: "Claude-Academy-03-Conectores-e-Skills.pdf",
    cover: "/assets/images/materiais/apostila-03.webp",
  },
  {
    id: "04",
    volume: "Módulo 3",
    title: "Configurações Avançadas",
    description:
      "Habilidades, conectores e plugins: os três eixos que tiram o máximo do Claude na advocacia.",
    topics: [
      "Habilidades essenciais para ativar",
      "O que são plugins",
      "Criar, instalar e gerenciar plugins",
      "Roteiro para os primeiros plugins",
    ],
    pages: 13,
    sizeBytes: 7_714_823,
    filePath: "apostila-04-configuracoes-avancadas.pdf",
    fileName: "Claude-Academy-04-Configuracoes-Avancadas.pdf",
    cover: "/assets/images/materiais/apostila-04.webp",
  },
  {
    id: "05",
    volume: "Masterclass",
    title: "Skill visual canônica",
    description:
      "Como transformar a identidade visual do escritório na base de todas as skills, para a peça sair com a sua cara.",
    topics: [
      "Por que o HTML aposenta o Word",
      "Cabeçalho, rodapé e logo vetorial",
      "Tipografia e jurisprudência em sanduíche",
      "Gerar o arquivo .skill",
    ],
    pages: 24,
    sizeBytes: 10_414_515,
    filePath: "apostila-05-skill-visual-canonica.pdf",
    fileName: "Claude-Academy-05-Skill-Visual-Canonica.pdf",
    cover: "/assets/images/materiais/apostila-05.webp",
  },
  {
    id: "06",
    volume: "Edição PRO",
    title: "Vale a pena? Viabilidade de caso",
    description:
      "Como usar a skill de viabilidade na triagem real: configurar a régua do escritório e transformar o veredito em decisão comercial.",
    topics: [
      "Ter razão não é ter caso: as quatro portas",
      "Configurar a régua do escritório",
      "Ler o relatório com desconfiança",
      "Do veredito à proposta",
    ],
    pages: 14,
    sizeBytes: 6_200_156,
    filePath: "apostila-06-viabilidade-de-caso.pdf",
    fileName: "Claude-Academy-06-Viabilidade-de-Caso.pdf",
    cover: "/assets/images/materiais/apostila-06.webp",
  },
  {
    id: "07",
    volume: "Vol. 4",
    title: "Projetos: o especialista que você constrói",
    description:
      "Como transformar um projeto do Claude num analista que conhece o seu acervo e entrega parecer pronto para o cliente.",
    topics: [
      "As três memórias do Claude",
      "A biblioteca de contexto do projeto",
      "Instruções que fazem o projeto pensar",
      "Ler 1.300 páginas sem ler 1.300 páginas",
    ],
    pages: 20,
    sizeBytes: 6_951_281,
    filePath: "apostila-07-dominando-projetos.pdf",
    fileName: "Claude-Academy-07-Dominando-Projetos.pdf",
    cover: "/assets/images/materiais/apostila-07.webp",
  },
  {
    id: "08",
    volume: "Aula ao vivo",
    title: "Recursos, Liquidação e Cowork",
    description:
      "Recurso com skill, liquidação de sentença com conector do BACEN e automações de Cowork para o dia a dia do escritório.",
    topics: [
      "Embargos de declaração com a skill de recursos",
      "Liquidação cível com conector BACEN",
      "Procurações e gratuidades em lote",
      "Organização automática de pastas",
    ],
    pages: 16,
    sizeBytes: 2_465_601,
    filePath: "apostila-08-recursos-liquidacao-cowork.pdf",
    fileName: "Claude-Academy-08-Recursos-Liquidacao-Cowork.pdf",
    cover: "/assets/images/materiais/apostila-08.webp",
  },
];

export function findFreeMaterial(id: string): FreeMaterial | undefined {
  return FREE_MATERIALS.find((material) => material.id === id);
}

export function freeMaterialDownloadHref(id: string): string {
  return `/api/materiais/download?id=${encodeURIComponent(id)}`;
}
