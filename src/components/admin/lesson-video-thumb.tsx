"use client";

import { useState } from "react";
import { ExternalLink, Film, Play } from "lucide-react";
import type { LessonAdminRow } from "@/lib/lessons/types";
import {
  lessonVideo,
  lessonVideoThumbnail,
} from "@/lib/lessons/video-urls";
import styles from "./admin-dashboard.module.css";

export function LessonVideoThumb({
  lesson,
  onPreview,
}: {
  lesson: LessonAdminRow;
  onPreview: (lesson: LessonAdminRow) => void;
}) {
  const video = lessonVideo(lesson);
  const thumb = lessonVideoThumbnail(lesson);
  const [thumbFailed, setThumbFailed] = useState(false);

  if (!video) {
    return (
      <div className={styles.videoThumbEmpty} aria-label="Sem vídeo">
        <Film className="size-4" aria-hidden />
        <span>Sem vídeo</span>
      </div>
    );
  }

  const showImage = thumb && !thumbFailed;

  return (
    <div className={styles.videoThumbStack}>
      {showImage ? (
        <button
          type="button"
          className={styles.videoThumbBtn}
          onClick={() => onPreview(lesson)}
          title={`Preview: ${lesson.title} (${video.label})`}
          aria-label={`Preview de ${lesson.title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb.src}
            alt=""
            className={styles.videoThumbImg}
            loading="lazy"
            decoding="async"
            onError={() => setThumbFailed(true)}
          />
          <span className={styles.videoThumbScrim} aria-hidden />
          <span className={styles.videoThumbPlay} aria-hidden>
            <Play className="size-3.5 fill-current" />
          </span>
          <span className={styles.videoThumbPlatform}>{video.label}</span>
          {lesson.duration ? (
            <span className={styles.videoThumbDuration}>{lesson.duration}</span>
          ) : null}
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.videoThumbBtn} ${styles.videoThumbBtnFallback}`}
          onClick={() => onPreview(lesson)}
          title={`Preview: ${lesson.title}`}
          aria-label={`Preview de ${lesson.title}`}
        >
          <Play className="size-5" aria-hidden />
          <span className={styles.videoThumbPlatform}>{video.label}</span>
        </button>
      )}

      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.videoThumbLink}
        title={video.url}
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="size-3 shrink-0" aria-hidden />
        <span>{video.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
      </a>
    </div>
  );
}
