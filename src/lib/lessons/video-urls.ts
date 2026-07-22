type VideoLesson = {
  youtubeId?: string | null;
  tella?: string | null;
};

/** URL pública do vídeo. Tella tem prioridade (regra do player). */
export function lessonVideo(
  lesson: VideoLesson,
): { url: string; label: string } | null {
  if (lesson.tella) {
    return { url: `https://www.tella.tv/video/${lesson.tella}`, label: "Tella" };
  }
  if (lesson.youtubeId) {
    return {
      url: `https://www.youtube.com/watch?v=${lesson.youtubeId}`,
      label: "YouTube",
    };
  }
  return null;
}

/** URL de embed pro player inline. */
export function lessonEmbedUrl(lesson: VideoLesson): string | null {
  if (lesson.tella) {
    return `https://www.tella.tv/video/${lesson.tella}/embed?b=0&title=0&a=0`;
  }
  if (lesson.youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${lesson.youtubeId}`;
  }
  return null;
}
