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
