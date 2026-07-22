"use client";

import {
  ExternalLink,
  Link2,
  MessageSquare,
  Paperclip,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import type { DragEvent } from "react";
import {
  dropPositionFromPointer,
  type DropPosition,
} from "@/lib/admin/dnd";
import { lessonVideo } from "@/lib/lessons/video-urls";
import type { LessonAdminRow } from "@/lib/lessons/types";
import { DragHandle, ReorderButtons } from "./admin-dnd";
import { Stars } from "./admin-ui";
import styles from "./admin-dashboard.module.css";

function VideoCell({
  lesson,
  onCopy,
  onPreview,
}: {
  lesson: LessonAdminRow;
  onCopy: (text: string) => void;
  onPreview: (l: LessonAdminRow) => void;
}) {
  const video = lessonVideo(lesson);
  if (!video) return <span className={styles.feedbackMeta}>Sem vídeo</span>;

  return (
    <div className={styles.rowActions}>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={() => onPreview(lesson)}
        title={`Preview (${video.label})`}
        aria-label={`Preview (${video.label})`}
      >
        <Play className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={() => onCopy(video.url)}
        title="Copiar link"
        aria-label="Copiar link do vídeo"
      >
        <Link2 className="size-4" aria-hidden />
      </button>
      <a
        className={styles.iconBtn}
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir vídeo"
        aria-label="Abrir vídeo em nova aba"
      >
        <ExternalLink className="size-4" aria-hidden />
      </a>
    </div>
  );
}

export function LessonRow({
  lesson,
  selectMode,
  selected,
  dbMode,
  canMoveUp,
  canMoveDown,
  dragging,
  dropPosition,
  onToggle,
  onCopy,
  onEdit,
  onPreview,
  onFeedback,
  onMaterials,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOverRow,
  onDragLeaveRow,
  onDrop,
  onMoveUp,
  onMoveDown,
  onKeyMove,
}: {
  lesson: LessonAdminRow;
  selectMode: boolean;
  selected: Set<string>;
  dbMode: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragging?: boolean;
  dropPosition?: DropPosition | null;
  onToggle: (key: string) => void;
  onCopy: (text: string) => void;
  onEdit: (l: LessonAdminRow) => void;
  onPreview: (l: LessonAdminRow) => void;
  onFeedback: (l: LessonAdminRow) => void;
  onMaterials: (l: LessonAdminRow) => void;
  onDelete: (l: LessonAdminRow) => void;
  onDragStart: (key: string) => void;
  onDragEnd: () => void;
  onDragOverRow: (key: string, position: DropPosition) => void;
  onDragLeaveRow: () => void;
  onDrop: (moduleId: string, targetKey: string, position: DropPosition) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onKeyMove: (l: LessonAdminRow, dir: -1 | 1) => void;
}) {
  const key = `${lesson.moduleId}:${lesson.lessonId}`;
  return (
    <tr
      className={`${styles.lessonRow}${dragging ? ` ${styles.lessonRowDragging}` : ""}${
        dropPosition === "before" ? ` ${styles.lessonRowDropBefore}` : ""
      }${dropPosition === "after" ? ` ${styles.lessonRowDropAfter}` : ""}`}
      onDragOver={(e) => {
        if (dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOverRow(
          key,
          dropPositionFromPointer(e.clientY, e.currentTarget.getBoundingClientRect()),
        );
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onDragLeaveRow();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(
          lesson.moduleId,
          key,
          dropPositionFromPointer(e.clientY, e.currentTarget.getBoundingClientRect()),
        );
      }}
    >
      <td>
        {selectMode ? (
          <input
            type="checkbox"
            checked={selected.has(key)}
            onChange={() => onToggle(key)}
            aria-label={`Selecionar ${lesson.title}`}
          />
        ) : null}
      </td>
      <td>
        <div className={styles.aulaCell}>
          <div className={styles.dragCluster}>
            <DragHandle
              label={`Reordenar ${lesson.title}. Use as setas para cima e para baixo.`}
              onDragStart={(e: DragEvent<HTMLSpanElement>) => {
                e.dataTransfer.setData("text/plain", key);
                onDragStart(key);
              }}
              onDragEnd={onDragEnd}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  onKeyMove(lesson, -1);
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  onKeyMove(lesson, 1);
                }
              }}
            />
            <ReorderButtons
              label={lesson.title}
              upDisabled={!canMoveUp}
              downDisabled={!canMoveDown}
              onUp={onMoveUp}
              onDown={onMoveDown}
            />
          </div>
          <div>
            <strong>{lesson.title}</strong>
            <br />
            <span className={styles.feedbackMeta}>
              {lesson.moduleTitle} · {lesson.lessonId}
            </span>
            {lesson.origin === "custom" ? (
              <span className={styles.customBadge}>criada no painel</span>
            ) : null}
          </div>
        </div>
      </td>
      <td>{lesson.viewCount}</td>
      <td>
        <div className={styles.notaCell}>
          <span>
            {lesson.avgRating !== null ? (
              <>
                <Stars rating={Math.round(lesson.avgRating)} />{" "}
                <span className={styles.feedbackMeta}>
                  {lesson.avgRating} ({lesson.feedbackCount})
                </span>
              </>
            ) : (
              <span className={styles.feedbackMeta}>-</span>
            )}
          </span>
          <button
            type="button"
            className={styles.feedbackBtn}
            onClick={() => onFeedback(lesson)}
            aria-label={`Ver avaliações de ${lesson.title}`}
          >
            <MessageSquare className="size-4" aria-hidden />
          </button>
        </div>
      </td>
      <td>
        <span
          className={`${styles.badge} ${lesson.published ? styles.badgeOn : styles.badgeOff}`}
        >
          {lesson.published ? "Publicada" : "Rascunho"}
        </span>
      </td>
      <td>
        <VideoCell lesson={lesson} onCopy={onCopy} onPreview={onPreview} />
      </td>
      <td>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onEdit(lesson)}
            title="Editar aula"
            aria-label={`Editar ${lesson.title}`}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onMaterials(lesson)}
            title="Materiais"
            aria-label={`Materiais de ${lesson.title}`}
          >
            <Paperclip className="size-4" aria-hidden />
          </button>
          {lesson.origin === "custom" || dbMode ? (
            <button
              type="button"
              className={styles.iconDangerBtn}
              onClick={() => onDelete(lesson)}
              title="Excluir aula"
              aria-label={`Excluir ${lesson.title}`}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
