// GENERATED — não edite à mão. Fonte da verdade: src/data/course.yml
// Rode `npm run course:build` após editar o YAML (o `prebuild` também roda).

export type CourseLesson = {
  id: string;
  title: string;
  duration: string;
  /** ID do vídeo YouTube (embed). Omitir = placeholder */
  youtubeId?: string;
  /** Slug público do vídeo no Tella (último trecho de tella.tv/video/<slug>). Tem prioridade sobre youtubeId. */
  tella?: string;
  description: string;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string;
  /** Gradiente CSS fallback quando não há capa */
  thumbnailGradient: string;
  /** Capa 3:4 da temporada (opcional; senão usa índice do módulo) */
  coverImage?: string;
  lessons: CourseLesson[];
};

export type Course = {
  title: string;
  subtitle: string;
  modules: CourseModule[];
};

export const COURSE: Course = {
  title: "Curso Claude Cowork para Advogados",
  subtitle: "Automatize 100% do seu escritório",
  modules: [
    {
      id: "comece-aqui",
      title: "Comece aqui",
      description: "O primeiro contato com o Claude: o que é, quem está por trás e o que decidir antes de começar.",
      thumbnailGradient: "linear-gradient(145deg, #1a0f0a 0%, #3d2218 40%, #d97757 100%)",
      coverImage: "/assets/images/temporadas/temporada-0-comece-aqui.png",
      lessons: [
        {
          id: "o-que-e-claude",
          title: "O que é o Claude",
          tella: "01-ca-1-o-que-e-o-claude-f528",
          duration: "3:32",
          description: "Não é só mais um chatbot. Uma inteligência que lê, raciocina e responde no nível de um colega sênior.",
        },
        {
          id: "o-que-e-anthropic",
          title: "O que é a Anthropic",
          tella: "02-ca-2-o-que-e-a-anthropic-d1o3",
          duration: "4:15",
          description: "Quem está por trás do Claude e por que isso importa pra quem lida com dado sensível de cliente.",
        },
        {
          id: "claude-vs-chatgpt",
          title: "Claude vs ChatGPT",
          tella: "03-ca-3-claude-vs-chatgpt-ahkq",
          duration: "5:34",
          description: "Onde o Claude brilha no jurídico, onde o ChatGPT leva vantagem, e por que o curso aposta no Claude.",
        },
        {
          id: "nivel-de-dificuldade",
          title: "Nível de dificuldade para adaptação",
          tella: "04-ca-4-nivel-de-dificuldade-para-adaptacao-224s",
          duration: "6:09",
          description: "A curva real de aprendizado: suave, com vitórias rápidas nos primeiros dias. Precisa de curiosidade, não de ser técnico.",
        },
        {
          id: "qual-plano-escolher",
          title: "Qual plano escolher",
          tella: "05-ca-5-qual-plano-escolher-04qx",
          duration: "5:42",
          description: "Visão geral de Free, Pro e Max pra você não travar na largada. O suficiente pra começar certo.",
        },
      ],
    },
    {
      id: "fundacao-pratica",
      title: "Fundação prática",
      description: "Do primeiro uau à primeira peça revisada. Aqui você para de assistir e começa a fazer.",
      thumbnailGradient: "linear-gradient(145deg, #0a0a0a 0%, #1f1410 45%, #c2410c 100%)",
      coverImage: "/assets/images/temporadas/temporada-1-fundacao-pratica.png",
      lessons: [
        {
          id: "o-que-vai-aprender",
          title: "O que você vai aprender no Módulo 1",
          tella: "10-intro-o-que-voce-vai-aprender-no-modulo-1-1-5ut1",
          duration: "4:27",
          description: "O trailer do módulo em poucos minutos: a jornada do primeiro uau à primeira petição revisada.",
        },
        {
          id: "5-superpoderes",
          title: "Os 5 superpoderes do Claude que mais ajudam advogados",
          tella: "11-os-5-superpoderes-do-claude-que-mais-ajudam-advogados-1-5crm",
          duration: "9:34",
          description: "Ler processos inteiros, dissecar contratos e laudos, criar peças e calculadoras do zero. A aula do encantamento.",
        },
        {
          id: "escritorio-seguro-ia",
          title: "Seu escritório está seguro para usar IA?",
          tella: "12-seu-escritorio-esta-seguro-para-usar-ia-4uuo",
          duration: "15:20",
          description: "As configurações de privacidade que todo advogado precisa ativar, e o que o Claude faz (e não faz) com o dado do cliente. LGPD e OAB desarmados.",
        },
        {
          id: "o-que-e-contexto",
          title: "O que é o contexto",
          tella: "13-o-que-e-contexto-326q",
          duration: "10:15",
          description: "O conceito mais importante do curso. O que o Claude tem em mente em cada conversa, e o que acontece quando estoura.",
        },
        {
          id: "ambientes-claude",
          title: "Chat, Projects, Chrome e Cowork: quando usar cada ambiente",
          tella: "14-chat-projects-chrome-e-cowork-quando-usar-cada-ambiente-dggd",
          duration: "7:02",
          description: "Chat pra dúvida pontual, Projects pro contexto permanente, Cowork pro Claude agindo nos seus arquivos. Quando usar cada um.",
        },
      ],
    },
  ],
};

export function findLesson(moduleId: string, lessonId: string) {
  const mod = COURSE.modules.find((m) => m.id === moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  return { module: mod, lesson };
}
