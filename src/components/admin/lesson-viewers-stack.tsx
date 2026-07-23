import {
  formatAdminDate,
  initialsFromEmail,
  viewerDisplayName,
} from "@/lib/admin/format";
import type { LessonViewer } from "@/lib/lessons/types";
import styles from "./admin-dashboard.module.css";

const MAX_VISIBLE = 4;

function ViewerAvatar({
  viewer,
  zIndex,
}: {
  viewer: LessonViewer;
  zIndex: number;
}) {
  const name = viewerDisplayName(viewer);

  return (
    <span
      className={styles.avatarChipWrap}
      style={{ zIndex }}
    >
      <span className={styles.avatarChip} aria-hidden>
        {initialsFromEmail(viewer.email)}
      </span>
      <span className={styles.avatarTooltip} role="tooltip">
        <strong className={styles.avatarTooltipName}>{name}</strong>
        <span className={styles.avatarTooltipEmail}>{viewer.email}</span>
        <span className={styles.avatarTooltipMeta}>
          Assistiu em {formatAdminDate(viewer.viewedAt)}
        </span>
      </span>
    </span>
  );
}

function ExtraViewersTooltip({ viewers }: { viewers: LessonViewer[] }) {
  return (
    <span className={styles.avatarChipWrap} style={{ zIndex: 0 }}>
      <span
        className={`${styles.avatarChip} ${styles.avatarChipExtra}`}
        aria-hidden
      >
        +{viewers.length}
      </span>
      <span
        className={`${styles.avatarTooltip} ${styles.avatarTooltipList}`}
        role="tooltip"
      >
        <strong className={styles.avatarTooltipName}>
          +{viewers.length} aluno{viewers.length === 1 ? "" : "s"}
        </strong>
        <ul className={styles.avatarTooltipUsers}>
          {viewers.map((viewer) => (
            <li key={viewer.userId}>
              <span>{viewerDisplayName(viewer)}</span>
              <span>{viewer.email}</span>
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
}

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
  const hidden = viewers.slice(MAX_VISIBLE);
  const extraViews = Math.max(0, total - viewers.length);

  return (
    <div className={styles.viewersCell}>
      {viewers.length > 0 ? (
        <div className={styles.avatarStack} aria-label={`${total} visualizações`}>
          {hidden.length > 0 ? <ExtraViewersTooltip viewers={hidden} /> : null}
          {[...shown].reverse().map((viewer, index) => (
            <ViewerAvatar
              key={viewer.userId}
              viewer={viewer}
              zIndex={index + 1 + (hidden.length > 0 ? 1 : 0)}
            />
          ))}
        </div>
      ) : null}
      <span
        className={styles.viewCountBadge}
        title={
          extraViews > 0
            ? `${total} views (${extraViews} sem identificação de aluno)`
            : `${total} visualização${total === 1 ? "" : "ões"}`
        }
      >
        {total}
        {extraViews > 0 ? (
          <span className={styles.viewCountAnon}> (+{extraViews})</span>
        ) : null}
      </span>
    </div>
  );
}
