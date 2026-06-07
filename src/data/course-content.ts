export type CourseLesson = {
  id: string;
  title: string;
  duration: string;
  /** ID do vídeo YouTube (embed). Omitir = placeholder */
  youtubeId?: string;
  description: string;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string;
  /** Gradiente CSS para thumbnail até ter arte dedicada */
  thumbnailGradient: string;
  lessons: CourseLesson[];
};

export const COURSE = {
  title: "Curso Claude Cowork para Advogados",
  subtitle: "Automatize 100% do seu escritório",
  modules: [
    {
      id: "cowork",
      title: "Cowork com Claude",
      description:
        "Como tratar o Claude como par na bancada: contexto, iteração e revisão de peças.",
      thumbnailGradient:
        "linear-gradient(145deg, #1a0f0a 0%, #3d2218 40%, #d97757 100%)",
      lessons: [
        {
          id: "cowork-1",
          title: "Boas-vindas e mapa do curso",
          duration: "8 min",
          description:
            "O que você vai dominar neste módulo e como organizar o Claude no fluxo do escritório.",
        },
        {
          id: "cowork-2",
          title: "Contexto que o Claude precisa para peças",
          duration: "14 min",
          description:
            "Como montar briefing, anexos e instruções para o Claude não perder o fio do caso.",
        },
        {
          id: "cowork-3",
          title: "Iteração e revisão na bancada",
          duration: "12 min",
          description:
            "Ciclos de rascunho, crítica e refinamento, com supervisão humana em cada etapa.",
        },
      ],
    },
    {
      id: "automacao",
      title: "Automatizar o escritório",
      description:
        "Modelos, checklists e fluxos para reduzir retrabalho sem abrir mão da supervisão humana.",
      thumbnailGradient:
        "linear-gradient(145deg, #0a0a0a 0%, #1f1410 45%, #c2410c 100%)",
      lessons: [
        {
          id: "auto-1",
          title: "Rotinas que valem automação",
          duration: "11 min",
          description:
            "Triagem, follow-up, resumos e classificação. Priorize o que dá retorno rápido.",
        },
        {
          id: "auto-2",
          title: "Checklists e modelos reutilizáveis",
          duration: "16 min",
          description:
            "Templates de prompts e fluxos Cowork para tarefas repetitivas do escritório.",
        },
        {
          id: "auto-3",
          title: "Integrando com WhatsApp e CRM",
          duration: "13 min",
          description:
            "Visão de como conectar Claude ao atendimento jurídico sem quebrar o processo.",
        },
      ],
    },
    {
      id: "etica",
      title: "Ética e dados",
      description:
        "Limites do uso de IA em dados sensíveis e comunicação com clientes.",
      thumbnailGradient:
        "linear-gradient(145deg, #0a0a0a 0%, #121212 50%, #8b4513 100%)",
      lessons: [
        {
          id: "etica-1",
          title: "Sigilo, LGPD e OAB na prática",
          duration: "15 min",
          description:
            "O que pode e o que não pode ir para o Claude: dados de clientes e processos.",
        },
        {
          id: "etica-2",
          title: "Comunicação transparente com clientes",
          duration: "9 min",
          description:
            "Como falar de IA no atendimento sem perder confiança nem violar deveres profissionais.",
        },
      ],
    },
  ] as CourseModule[],
};

export function findLesson(moduleId: string, lessonId: string) {
  const mod = COURSE.modules.find((m) => m.id === moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  return { module: mod, lesson };
}
