/** Utilitários puros de drag-and-drop do painel admin. */

export type DropPosition = "before" | "after";

type LessonKey = { moduleId: string; lessonId: string };

type LessonGroupLike = {
  moduleId: string;
  lessons: LessonKey[];
};

export function dropPositionFromPointer(
  clientY: number,
  rect: Pick<DOMRect, "top" | "height">,
): DropPosition {
  return clientY < rect.top + rect.height / 2 ? "before" : "after";
}

/** Converte posição before/after numa linha em chave de inserção (before lesson). */
export function resolveDropTarget(
  groups: LessonGroupLike[],
  targetModuleId: string,
  targetKey: string,
  position: DropPosition,
): string | null {
  if (position === "before") return targetKey;
  const group = groups.find((g) => g.moduleId === targetModuleId);
  if (!group) return targetKey;
  const idx = group.lessons.findIndex(
    (l) => `${l.moduleId}:${l.lessonId}` === targetKey,
  );
  if (idx < 0) return targetKey;
  const next = group.lessons[idx + 1];
  return next ? `${next.moduleId}:${next.lessonId}` : null;
}

const DRAG_GHOST_DATA =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

let dragGhost: HTMLImageElement | null = null;

/** Esconde o fantasma nativo — feedback fica na linha de origem. */
export function hideDragGhost(dataTransfer: DataTransfer) {
  if (typeof document === "undefined") return;
  if (!dragGhost) {
    dragGhost = new Image();
    dragGhost.src = DRAG_GHOST_DATA;
  }
  dataTransfer.setDragImage(dragGhost, 0, 0);
}
