export type LessonOverrideRow = {
  module_id: string;
  lesson_id: string;
  youtube_id: string | null;
  /** Slug do vídeo no Tella. Tem prioridade sobre youtube_id (regra do player). */
  tella: string | null;
  duration: string | null;
  title: string | null;
  description: string | null;
  published: boolean;
  /** Posição da aula dentro do módulo (null = usa a ordem do catálogo). */
  order_index: number | null;
  updated_at: string;
};

export type LessonViewRow = {
  id: string;
  module_id: string;
  lesson_id: string;
  user_id: string | null;
  viewed_at: string;
};

export type LessonFeedbackRow = {
  id: string;
  module_id: string;
  lesson_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type LessonViewer = {
  userId: string;
  email: string;
  /** Nome do perfil; null se só tiver e-mail. */
  name: string | null;
  viewedAt: string;
};

export type LessonAdminRow = {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  title: string;
  duration: string;
  description: string;
  youtubeId: string | null;
  tella: string | null;
  published: boolean;
  viewCount: number;
  /** Alunos únicos que assistiram (para avatar stack no painel). */
  viewers: LessonViewer[];
  feedbackCount: number;
  avgRating: number | null;
  orderIndex: number | null;
  /** "catalog" = vem do course.yml; "custom" = criada no painel (só-Supabase). */
  origin: "catalog" | "custom";
};

export type AdminTotals = {
  views: number;
  feedbacks: number;
  avgRating: number | null;
};

export type LessonFeedbackItem = {
  rating: number;
  comment: string | null;
  userEmail: string | null;
  createdAt: string;
};
