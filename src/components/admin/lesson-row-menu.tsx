"use client";

import {
  ExternalLink,
  Link2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { lessonVideo } from "@/lib/lessons/video-urls";
import type { LessonAdminRow } from "@/lib/lessons/types";
import styles from "./admin-dashboard.module.css";

export type MenuPoint = { x: number; y: number };

type MenuEntry =
  | { type: "sep" }
  | {
      type: "action";
      id: string;
      label: string;
      icon: ReactNode;
      danger?: boolean;
      onSelect: () => void;
    }
  | {
      type: "link";
      id: string;
      label: string;
      icon: ReactNode;
      href: string;
    };

function clampMenuPosition(x: number, y: number, menuEl: HTMLElement | null) {
  const margin = 8;
  const w = menuEl?.offsetWidth ?? 200;
  const h = menuEl?.offsetHeight ?? 240;
  return {
    x: Math.max(margin, Math.min(x, window.innerWidth - w - margin)),
    y: Math.max(margin, Math.min(y, window.innerHeight - h - margin)),
  };
}

export function LessonRowMenu({
  lesson,
  dbMode,
  menuAt,
  onOpenMenu,
  onCloseMenu,
  onCopy,
  onEdit,
  onPreview,
  onFeedback,
  onMaterials,
  onDelete,
}: {
  lesson: LessonAdminRow;
  dbMode: boolean;
  menuAt: MenuPoint | null;
  onOpenMenu: (point: MenuPoint) => void;
  onCloseMenu: () => void;
  onCopy: (text: string) => void;
  onEdit: (l: LessonAdminRow) => void;
  onPreview: (l: LessonAdminRow) => void;
  onFeedback: (l: LessonAdminRow) => void;
  onMaterials: (l: LessonAdminRow) => void;
  onDelete: (l: LessonAdminRow) => void;
}) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const video = lessonVideo(lesson);
  const canDelete = lesson.origin === "custom" || dbMode;

  useEffect(() => {
    if (!menuAt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuAt, onCloseMenu]);

  useEffect(() => {
    if (!menuAt || !menuRef.current) return;
    const clamped = clampMenuPosition(menuAt.x, menuAt.y, menuRef.current);
    if (clamped.x !== menuAt.x || clamped.y !== menuAt.y) {
      onOpenMenu(clamped);
    }
  }, [menuAt, onOpenMenu]);

  const entries: MenuEntry[] = [
    {
      type: "action",
      id: "edit",
      label: "Editar aula",
      icon: <Pencil className="size-4" aria-hidden />,
      onSelect: () => onEdit(lesson),
    },
    {
      type: "action",
      id: "materials",
      label: "Materiais",
      icon: <Paperclip className="size-4" aria-hidden />,
      onSelect: () => onMaterials(lesson),
    },
    { type: "sep" },
    {
      type: "action",
      id: "feedback",
      label: "Avaliações",
      icon: <MessageSquare className="size-4" aria-hidden />,
      onSelect: () => onFeedback(lesson),
    },
  ];

  if (video) {
    entries.push(
      { type: "sep" },
      {
        type: "action",
        id: "preview",
        label: `Preview (${video.label})`,
        icon: <Play className="size-4" aria-hidden />,
        onSelect: () => onPreview(lesson),
      },
      {
        type: "action",
        id: "copy",
        label: "Copiar link do vídeo",
        icon: <Link2 className="size-4" aria-hidden />,
        onSelect: () => onCopy(video.url),
      },
      {
        type: "link",
        id: "open",
        label: "Abrir vídeo",
        icon: <ExternalLink className="size-4" aria-hidden />,
        href: video.url,
      },
    );
  }

  if (canDelete) {
    entries.push(
      { type: "sep" },
      {
        type: "action",
        id: "delete",
        label: "Excluir aula",
        icon: <Trash2 className="size-4" aria-hidden />,
        danger: true,
        onSelect: () => onDelete(lesson),
      },
    );
  }

  const menu =
    menuAt && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              className={styles.menuBackdrop}
              role="presentation"
              onClick={onCloseMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                onCloseMenu();
              }}
            />
            <div
              ref={menuRef}
              id={menuId}
              className={styles.contextMenu}
              style={{ top: menuAt.y, left: menuAt.x }}
              role="menu"
              aria-label={`Ações de ${lesson.title}`}
            >
              {entries.map((entry, index) => {
                if (entry.type === "sep") {
                  return (
                    <div
                      key={`sep-${index}`}
                      className={styles.contextMenuSep}
                      role="separator"
                    />
                  );
                }
                if (entry.type === "link") {
                  return (
                    <a
                      key={entry.id}
                      className={styles.contextMenuItem}
                      role="menuitem"
                      href={entry.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onCloseMenu}
                    >
                      {entry.icon}
                      {entry.label}
                    </a>
                  );
                }
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`${styles.contextMenuItem}${
                      entry.danger ? ` ${styles.contextMenuItemDanger}` : ""
                    }`}
                    role="menuitem"
                    onClick={() => {
                      entry.onSelect();
                      onCloseMenu();
                    }}
                  >
                    {entry.icon}
                    {entry.label}
                  </button>
                );
              })}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={styles.rowMenuBtn}
        aria-label={`Ações de ${lesson.title}`}
        aria-haspopup="menu"
        aria-expanded={menuAt !== null}
        aria-controls={menuAt ? menuId : undefined}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onOpenMenu({ x: rect.left, y: rect.bottom + 4 });
        }}
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
      {menu}
    </>
  );
}
