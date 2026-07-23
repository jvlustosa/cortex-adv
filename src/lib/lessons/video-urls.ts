type VideoLesson = {
  youtubeId?: string | null;
  tella?: string | null;
};

export type LessonVideoThumb = {
  src: string;
  label: "Tella" | "YouTube";
  videoUrl: string;
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

/** Thumbnail 16:9 para preview no admin (CDN Tella / img.youtube.com). */
export function lessonVideoThumbnail(
  lesson: VideoLesson,
): LessonVideoThumb | null {
  if (lesson.tella) {
    return {
      src: `https://cdn.tella.tv/thumbnails/${encodeURIComponent(lesson.tella)}/640x360.jpg`,
      label: "Tella",
      videoUrl: `https://www.tella.tv/video/${lesson.tella}`,
    };
  }
  if (lesson.youtubeId) {
    return {
      src: `https://i.ytimg.com/vi/${encodeURIComponent(lesson.youtubeId)}/mqdefault.jpg`,
      label: "YouTube",
      videoUrl: `https://www.youtube.com/watch?v=${lesson.youtubeId}`,
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
