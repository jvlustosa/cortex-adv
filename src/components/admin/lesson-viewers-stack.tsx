import { initialsFromEmail } from "@/lib/admin/format";
import type { LessonViewer } from "@/lib/lessons/types";
import styles from "./admin-dashboard.module.css";

const MAX_VISIBLE = 4;

export function LessonViewersStack({
  viewers,
  total,
}: {
  viewers: LessonViewer[];
  total: number;
}) {
  if (total === 0) {
    return <span className={styles.viewersEmpty}>—</span>;
  }

  const shown = viewers.slice(0, MAX_VISIBLE);
  const extraUsers = Math.max(0, viewers.length - shown.length);
  const extraViews = Math.max(0, total - viewers.length);

  const labelParts = [
    `${total} visualização${total === 1 ? "" : "ões"}`,
    viewers.length > 0
      ? viewers.map((v) => v.email).join(", ")
      : "sem identificação de aluno",
  ];

  return (
    <div
      className={styles.viewersCell}
      aria-label={labelParts.join(" · ")}
    >
      {viewers.length > 0 ? (
        <div className={styles.avatarStack} aria-hidden>
          {shown.map((viewer, index) => (
            <span
              key={viewer.userId}
              className={styles.avatarChip}
              style={{ zIndex: MAX_VISIBLE - index }}
              title={`${viewer.email} · ${new Date(viewer.viewedAt).toLocaleString("pt-BR")}`}
            >
              {initialsFromEmail(viewer.email)}
            </span>
          ))}
          {extraUsers > 0 ? (
            <span
              className={`${styles.avatarChip} ${styles.avatarChipExtra}`}
              style={{ zIndex: 0 }}
              title={`+${extraUsers} aluno(s)`}
            >
              +{extraUsers}
            </span>
          ) : null}
        </div>
      ) : null}
      <span className={styles.viewCountBadge} title={labelParts.join(" · ")}>
        {total}
        {extraViews > 0 ? (
          <span className={styles.viewCountAnon}> (+{extraViews})</span>
        ) : null}
      </span>
    </div>
  );
}
