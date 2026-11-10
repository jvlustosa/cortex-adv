// Apostilas do curso. O cadastro vivo é editado pelo /admin, aba "Materiais
// Didáticos", e fica em `catalogo.json` no bucket privado `free-materials`
// (src/lib/materials/storage.ts). O que está neste arquivo é o catálogo
// inicial: vale enquanto ninguém salvou nada pelo admin e no modo demo.
// Depois do primeiro salvamento, editar FREE_MATERIALS aqui não muda o site.
// - Gratuitas (exclusive: false): aparecem também em /materiais, com o gate de
//   lead no client, e baixam por /api/materiais/download.
// - Exclusivas: só na área de membros (/area-de-membros/materiais), com
//   download por /api/materiais/alunos/download, que exige login.
// Os PDFs e as capas novas ficam no mesmo bucket. Apostila sem PDF no bucket
// não aparece para ninguém. O download assina o arquivo na hora do clique.
// Passo a passo em docs/materiais-didaticos.md.

export const FREE_MATERIALS_BUCKET = "free-materials";

export type MaterialCategory = {
  id: string;
  title: string;
  /** Uma frase dizendo o que o aluno encontra nesta categoria. */
  description: string;
};

/**
 * Categorias dos Materiais Didáticos, na ordem em que aparecem na página.
 * Para criar uma categoria, acrescente uma entrada aqui (PR): ela passa a
 * aparecer no seletor do /admin. Categoria sem apostila não aparece para o
 * aluno. Não remova categoria em uso: as apostilas dela somem da página.
 */
export const MATERIAL_CATEGORIES = [
  {
    id: "trilha",
    title: "Trilha do curso",
    description:
      "As apostilas que acompanham os módulos, na ordem das aulas.",
  },
  {
    id: "extras",
    title: "Masterclasses e aulas extras",
    description:
      "Material das masterclasses, aulas ao vivo e edições especiais.",
  },
] as const satisfies readonly MaterialCategory[];

export type MaterialCategoryId = (typeof MATERIAL_CATEGORIES)[number]["id"];

export type MaterialEntry = {
  /** Usado na URL de download e como chave do arquivo no bucket. */
  id: string;
  /** Categoria em Materiais Didáticos (id de MATERIAL_CATEGORIES). */
  category: MaterialCategoryId;
  volume: string;
  title: string;
  description: string;
  topics: string[];
  pages: number;
  /**
   * Tamanho do PDF. Na hora de mostrar, vale o tamanho real do arquivo no
   * bucket; o número daqui só serve ao script de upload.
   */
  sizeBytes?: number;
  /** Caminho do PDF no bucket. */
  filePath: string;
  /** Nome sugerido no download (ASCII, sem espaço). */
  fileName: string;
  /**
   * Capa: caminho em public/ (catálogo inicial), `capas/...` no bucket
   * (enviada pelo admin) ou vazio (sem capa ainda).
   */
  cover: string;
};

/** A página pública mostra o tamanho fixo, então aqui ele é obrigatório. */
export type FreeMaterial = MaterialEntry & { sizeBytes: number };

export const FREE_MATERIALS: FreeMaterial[] = [
  {
    id: "01",
    category: "trilha",
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
    category: "trilha",
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
    category: "trilha",
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
    category: "trilha",
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
    category: "extras",
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
    category: "extras",
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
    category: "trilha",
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
    category: "extras",
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

/**
 * Exclusivas do catálogo inicial (nenhuma). Apostila nova se cadastra pelo
 * /admin; ver o comentário no topo do arquivo.
 */
export const MEMBER_MATERIALS: MaterialEntry[] = [];

export type CourseMaterial = MaterialEntry & {
  /** true = só aparece para alunos (não está em /materiais). */
  exclusive: boolean;
};

/** Catálogo inicial completo: gratuitas primeiro, depois as exclusivas. */
export const COURSE_MATERIALS: CourseMaterial[] = [
  ...FREE_MATERIALS.map((material) => ({ ...material, exclusive: false })),
  ...MEMBER_MATERIALS.map((material) => ({ ...material, exclusive: true })),
];

/** Arquivo encontrado no bucket, por caminho (filePath). */
export type StoredMaterialFile = {
  size: number;
  updatedAt: string | null;
};

/**
 * O que o aluno vê: só apostila cujo PDF já está no bucket (cadastro sem
 * arquivo ainda não aparece), com o tamanho real do arquivo.
 */
export function publishedMaterials(
  materials: CourseMaterial[],
  stored: Map<string, StoredMaterialFile>,
): CourseMaterial[] {
  return materials.flatMap((material) => {
    const file = stored.get(material.filePath);
    return file ? [{ ...material, sizeBytes: file.size }] : [];
  });
}

export type MaterialCategoryGroup = {
  category: MaterialCategory;
  materials: CourseMaterial[];
};

/**
 * Agrupa as apostilas na ordem de MATERIAL_CATEGORIES (dentro de cada uma,
 * a ordem da lista). Categoria vazia fica de fora.
 */
export function groupMaterialsByCategory(
  materials: CourseMaterial[],
): MaterialCategoryGroup[] {
  return MATERIAL_CATEGORIES.map((category) => ({
    category,
    materials: materials.filter((m) => m.category === category.id),
  })).filter((group) => group.materials.length > 0);
}

/** Minúsculo e sem acento, para a busca achar "conferencia" em "Conferência". */
function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export type MaterialFilter = {
  /** Texto digitado pelo aluno; cada palavra precisa aparecer na apostila. */
  query?: string;
  /** null/undefined = todas as categorias. */
  category?: MaterialCategoryId | null;
};

/**
 * Busca dos Materiais Didáticos: procura em título, descrição, tópicos e
 * volume. Mantém a ordem da lista.
 */
export function filterMaterials(
  materials: CourseMaterial[],
  { query = "", category = null }: MaterialFilter = {},
): CourseMaterial[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);

  return materials.filter((material) => {
    if (category && material.category !== category) return false;
    if (words.length === 0) return true;

    const haystack = normalizeSearch(
      [
        material.title,
        material.description,
        material.volume,
        ...material.topics,
      ].join(" "),
    );
    return words.every((word) => haystack.includes(word));
  });
}

export function freeMaterialDownloadHref(id: string): string {
  return `/api/materiais/download?id=${encodeURIComponent(id)}`;
}

export function courseMaterialDownloadHref(id: string): string {
  return `/api/materiais/alunos/download?id=${encodeURIComponent(id)}`;
}
