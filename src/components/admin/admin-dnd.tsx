"use client";

import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import type { DragEvent, KeyboardEvent } from "react";
import { hideDragGhost } from "@/lib/admin/dnd";
import styles from "./admin-dashboard.module.css";

export function DragHandle({
  label,
  onDragStart,
  onDragEnd,
  onKeyDown,
}: {
  label: string;
  onDragStart: (e: DragEvent<HTMLSpanElement>) => void;
  onDragEnd: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) => void;
}) {
  return (
    <span
      className={styles.dragHandle}
      draggable
      role="button"
      tabIndex={0}
      aria-label={label}
      onDragStart={(e) => {
        hideDragGhost(e.dataTransfer);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(e);
      }}
      onDragEnd={onDragEnd}
      onKeyDown={onKeyDown}
    >
      <GripVertical className="size-4" aria-hidden />
    </span>
  );
}

export function ReorderButtons({
  onUp,
  onDown,
  upDisabled,
  downDisabled,
  label,
}: {
  onUp: () => void;
  onDown: () => void;
  upDisabled?: boolean;
  downDisabled?: boolean;
  label: string;
}) {
  return (
    <div className={styles.reorderBtns}>
      <button
        type="button"
        className={styles.reorderBtn}
        aria-label={`${label}: mover para cima`}
        disabled={upDisabled}
        onClick={onUp}
      >
        <ChevronUp className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className={styles.reorderBtn}
        aria-label={`${label}: mover para baixo`}
        disabled={downDisabled}
        onClick={onDown}
      >
        <ChevronDown className="size-4" aria-hidden />
      </button>
    </div>
  );
}
