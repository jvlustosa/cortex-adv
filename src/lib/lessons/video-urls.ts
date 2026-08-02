type VideoLesson = {
  youtubeId?: string | null;
  tella?: string | null;
};

export type LessonVideoThumb = {
  src: string;
  label: "Tella" | "YouTube";
  videoUrl: string;
};

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

/** Aceita slug ou URL completa do Tella. */
export function normalizeTellaSlug(raw?: string | null): string | null {
  const value = trimOrNull(raw);
  if (!value) return null;

  const fromUrl = value.match(/tella\.tv\/video\/([^/?#]+)/i);
  if (fromUrl) return fromUrl[1];

  if (/^https?:\/\//i.test(value)) {
    try {
      const parts = new URL(value).pathname.split("/").filter(Boolean);
      const videoIdx = parts.indexOf("video");
      if (videoIdx >= 0 && parts[videoIdx + 1]) return parts[videoIdx + 1];
    } catch {
      return null;
    }
    return null;
  }

  return value;
}

/** Aceita ID ou URL do YouTube. */
export function normalizeYoutubeId(raw?: string | null): string | null {
  const value = trimOrNull(raw);
  if (!value) return null;

  const short = value.match(/youtu\.be\/([^/?#&]+)/i);
  if (short) return short[1];

  const watch = value.match(/[?&]v=([^&]+)/i);
  if (watch) return watch[1];

  const embed = value.match(/youtube\.com\/embed\/([^/?#&]+)/i);
  if (embed) return embed[1];

  if (/^https?:\/\//i.test(value)) return null;

  return value;
}

function resolveVideoIds(lesson: VideoLesson) {
  return {
    tella: normalizeTellaSlug(lesson.tella),
    youtubeId: normalizeYoutubeId(lesson.youtubeId),
  };
}

export type VideoSource = {
  kind: "tella" | "youtube";
  label: "Tella" | "YouTube";
  /** URL do iframe. */
  embedUrl: string;
  /** URL pra abrir fora do iframe — a saída quando o embed não carrega. */
  watchUrl: string;
};

/**
 * Fontes tocáveis da aula, em ordem de preferência (Tella primeiro).
 *
 * Iframe cross-origin não emite `error`: quando o Tella é bloqueado por
 * firewall/adblock ou o vídeo some, o `load` ainda dispara como se tivesse dado
 * certo. Não dá pra detectar a falha — por isso o player expõe as fontes todas
 * e deixa o aluno trocar na mão em vez de fingir uma detecção que não existe.
 */
export function lessonVideoSources(lesson: VideoLesson): VideoSource[] {
  const { tella, youtubeId } = resolveVideoIds(lesson);
  const sources: VideoSource[] = [];

  if (tella) {
    sources.push({
      kind: "tella",
      label: "Tella",
      embedUrl: `https://www.tella.tv/video/${tella}/embed?b=0&title=0&a=0`,
      watchUrl: `https://www.tella.tv/video/${tella}`,
    });
  }
  if (youtubeId) {
    sources.push({
      kind: "youtube",
      label: "YouTube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    });
  }

  return sources;
}

/** URL pública do vídeo. Tella tem prioridade (regra do player). */
export function lessonVideo(
  lesson: VideoLesson,
): { url: string; label: string } | null {
  const { tella, youtubeId } = resolveVideoIds(lesson);
  if (tella) {
    return { url: `https://www.tella.tv/video/${tella}`, label: "Tella" };
  }
  if (youtubeId) {
    return {
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
      label: "YouTube",
    };
  }
  return null;
}

/** Thumbnail 16:9 para preview no admin (CDN Tella / img.youtube.com). */
export function lessonVideoThumbnail(
  lesson: VideoLesson,
): LessonVideoThumb | null {
  const video = lessonVideo(lesson);
  if (!video) return null;

  const { tella, youtubeId } = resolveVideoIds(lesson);
  if (tella) {
    return {
      src: `https://cdn.tella.tv/thumbnails/${encodeURIComponent(tella)}/640x360.jpg`,
      label: "Tella",
      videoUrl: video.url,
    };
  }
  if (youtubeId) {
    return {
      src: `https://i.ytimg.com/vi/${encodeURIComponent(youtubeId)}/mqdefault.jpg`,
      label: "YouTube",
      videoUrl: video.url,
    };
  }
  return null;
}

/** URL de embed pro player inline. */
export function lessonEmbedUrl(lesson: VideoLesson): string | null {
  const { tella, youtubeId } = resolveVideoIds(lesson);
  if (tella) {
    return `https://www.tella.tv/video/${tella}/embed?b=0&title=0&a=0`;
  }
  if (youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
  }
  return null;
}
