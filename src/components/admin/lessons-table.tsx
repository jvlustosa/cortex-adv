"use client";

import type { DragEvent } from "react";
import { useState } from "react";
import {
  dropPositionFromPointer,
  type DropPosition,
} from "@/lib/admin/dnd";
import type { LessonAdminRow } from "@/lib/lessons/types";
import { DragHandle, ReorderButtons } from "./admin-dnd";
import {
  LessonRowMenu,
  type MenuPoint,
} from "./lesson-row-menu";
import { LessonVideoThumb } from "./lesson-video-thumb";
import { Stars } from "./admin-ui";
import { LessonViewersStack } from "./lesson-viewers-stack";
import styles from "./admin-dashboard.module.css";

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
  const [menuAt, setMenuAt] = useState<MenuPoint | null>(null);

  return (
    <tr
      className={`${styles.lessonRow}${dragging ? ` ${styles.lessonRowDragging}` : ""}${
        dropPosition === "before" ? ` ${styles.lessonRowDropBefore}` : ""
      }${dropPosition === "after" ? ` ${styles.lessonRowDropAfter}` : ""}${
        menuAt ? ` ${styles.lessonRowMenuOpen}` : ""
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuAt({ x: e.clientX, y: e.clientY });
      }}
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
      <td>
        <LessonViewersStack viewers={lesson.viewers} total={lesson.viewCount} />
      </td>
      <td>
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
      </td>
      <td>
        <span
          className={`${styles.badge} ${lesson.published ? styles.badgeOn : styles.badgeOff}`}
        >
          {lesson.published ? "Publicada" : "Rascunho"}
        </span>
      </td>
      <td className={styles.videoThumbCell}>
        <LessonVideoThumb lesson={lesson} onPreview={onPreview} />
      </td>
      <td className={styles.rowMenuCell}>
        <LessonRowMenu
          lesson={lesson}
          dbMode={dbMode}
          menuAt={menuAt}
          onOpenMenu={setMenuAt}
          onCloseMenu={() => setMenuAt(null)}
          onCopy={onCopy}
          onEdit={onEdit}
          onPreview={onPreview}
          onFeedback={onFeedback}
          onMaterials={onMaterials}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
