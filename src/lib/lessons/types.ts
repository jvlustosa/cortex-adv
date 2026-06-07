export type LessonOverrideRow = {
  module_id: string;
  lesson_id: string;
  youtube_id: string | null;
  duration: string | null;
  title: string | null;
  description: string | null;
  published: boolean;
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

export type LessonAdminRow = {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  title: string;
  duration: string;
  description: string;
  youtubeId: string | null;
  published: boolean;
  viewCount: number;
  feedbackCount: number;
  avgRating: number | null;
};

export type AdminTotals = {
  views: number;
  feedbacks: number;
  avgRating: number | null;
};
