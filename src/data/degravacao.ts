// Conteúdo do produto Degravação com Claude, compartilhado entre a página de
// vendas (/degravacao) e a área do aluno (/area-de-membros/degravacao).
// Fonte: README do plugin (github.com/mcastelan35/degravacao-claude-advogados).
// Mudou o plugin, confere aqui: a página não pode prometer o que ele não faz.

import { DEGRAVACAO_REPO } from "@/lib/degravacao/releases";

export const DEGRAVACAO_AUTHOR = {
  name: "Marcos Vilas Boas",
  instagram: "https://www.instagram.com/advvilasboas/",
  handle: "@advvilasboas",
} as const;

export const DEGRAVACAO_FEATURES: { title: string; description: string }[] = [
  {
    title: "Transcrição no seu computador",
    description:
      "O Whisper roda na sua máquina. O vídeo e o áudio não são enviados para nenhum serviço.",
  },
  {
    title: "Quem falou o quê",
    description:
      "Separa os falantes pela voz, também no seu computador e sem conta ou chave. O Claude revisa pelo sentido da conversa.",
  },
  {
    title: "Documento pronto para usar",
    description:
      "Degravação integral com minutagem, mais resumo, participantes, tópicos e pontos de atenção. Em Markdown e em Word.",
  },
  {
    title: "Player com marcações",
    description:
      "Vídeo com o texto sincronizado. Marque trechos como Relevante, Favorável, Desfavorável, Contradição ou Conferir e copie como citação com minutagem.",
  },
];

/**
 * Prints do plugin rodando de verdade numa audiência fictícia (vozes
 * sintéticas, 2 min 36 s). Para refazer: degravar o vídeo de demonstração,
 * estruturar, aplicar as marcações e fotografar o player.html.
 */
export const DEGRAVACAO_HERO_SCREENSHOT = {
  src: "/assets/images/degravacao/player.webp",
  width: 1600,
  height: 1000,
  alt: "Player do Degravação com o vídeo de uma audiência, a forma de onda colorida por falante e a transcrição sincronizada com minutagem",
} as const;

export const DEGRAVACAO_SCREENSHOTS: {
  src: string;
  alt: string;
  title: string;
  description: string;
}[] = [
  {
    src: "/assets/images/degravacao/resumo.webp",
    alt: "Aba Resumo do player com resumo executivo e tabela de participantes",
    title: "Resumo pronto para ler antes da peça",
    description:
      "O Claude lê a degravação inteira e escreve resumo, participantes, tópicos e pontos de atenção. Cada item tem minutagem, e nada entra sem ter sido dito.",
  },
  {
    src: "/assets/images/degravacao/citacao.webp",
    alt: "Trecho selecionado na transcrição com os botões Copiar citação e Marcar como",
    title: "Citação com minutagem em um clique",
    description:
      "Selecione o trecho e copie já no formato “texto” (Testemunha, 00:01:55–00:01:59). É só colar na peça.",
  },
  {
    src: "/assets/images/degravacao/marcacoes.webp",
    alt: "Aba Marcações com trechos classificados como Favorável e Relevante, cada um com nota",
    title: "Marcações por categoria",
    description:
      "Favorável, Desfavorável, Contradição, Relevante ou Conferir, com a sua nota. Elas vão para o documento e para o Word.",
  },
  {
    src: "/assets/images/degravacao/word.webp",
    alt: "Documento Word da degravação com ficha técnica e resumo executivo",
    title: "Word para editar ou anexar",
    description:
      "Ficha técnica, resumo, tópicos, marcações e a transcrição integral com o nome de quem fala, no formato de ata.",
  },
];

/** Para que serve, nos termos do dia a dia do escritório. */
export const DEGRAVACAO_USE_CASES = [
  "Audiências",
  "Depoimentos",
  "Reuniões com clientes",
  "Áudios de WhatsApp",
  "Aulas e palestras",
];

export const DEGRAVACAO_REQUIREMENTS = [
  "App do Claude com a aba Code (Claude Code)",
  "Windows 10/11 (x64) ou macOS",
  "Uns 6 GB livres. A primeira degravação baixa o modelo de transcrição (1,6 a 3 GB), uma vez só",
];

export const DEGRAVACAO_INSTALL_STEPS = [
  "Baixe o arquivo .plugin da versão mais nova, logo acima.",
  "No claude.ai, abra Personalizar › Plugins e envie o arquivo. Ele aparece sozinho no Claude Code.",
  "Abra a aba Code em qualquer pasta e digite /degravacao:comecar (ou só “quero começar a degravar”).",
  "O Claude confere o computador, instala o que falta sem pedir senha de administrador, pergunta onde ficam os vídeos, testa com uma audiência fictícia de 40 segundos e abre o player.",
];

/** Caminho alternativo, para quem tem Git: instala e atualiza pelo marketplace. */
export const DEGRAVACAO_MARKETPLACE_COMMANDS = [
  `/plugin marketplace add ${DEGRAVACAO_REPO}`,
  "/plugin install degravacao@degravacao-claude-advogados",
];

export const DEGRAVACAO_PROMPTS = [
  "Degrava os vídeos novos.",
  "Degrava essa audiência separando os falantes: são 3 pessoas (juiz, advogada e testemunha).",
  "Estrutura a degravação audiencia-03-05",
  "Aplique a revisão da degravação audiencia-03-05",
  "Abre o vídeo da audiência no minuto 12",
];
