"use client";

import { useState } from "react";
import { Film, Play } from "lucide-react";
import type { LessonAdminRow } from "@/lib/lessons/types";
import { lessonVideoThumbnail } from "@/lib/lessons/video-urls";
import styles from "./admin-dashboard.module.css";

export function LessonVideoThumb({
  lesson,
  onPreview,
}: {
  lesson: LessonAdminRow;
  onPreview: (lesson: LessonAdminRow) => void;
}) {
  const thumb = lessonVideoThumbnail(lesson);
  const [failed, setFailed] = useState(false);

  if (!thumb || failed) {
    return (
      <div className={styles.videoThumbEmpty} aria-label="Sem vídeo">
        <Film className="size-4" aria-hidden />
        <span>Sem vídeo</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.videoThumbBtn}
      onClick={() => onPreview(lesson)}
      title={`Preview: ${lesson.title} (${thumb.label})`}
      aria-label={`Preview de ${lesson.title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb.src}
        alt=""
        className={styles.videoThumbImg}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
      <span className={styles.videoThumbScrim} aria-hidden />
      <span className={styles.videoThumbPlay} aria-hidden>
        <Play className="size-3.5 fill-current" />
      </span>
      <span className={styles.videoThumbPlatform}>{thumb.label}</span>
      {lesson.duration ? (
        <span className={styles.videoThumbDuration}>{lesson.duration}</span>
      ) : null}
    </button>
  );
}
