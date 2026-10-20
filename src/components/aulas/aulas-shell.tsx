import { MembersFooterActions } from "@/components/aulas/members-footer-actions";
import { MembersShellHeader } from "@/components/aulas/members-shell-header";
import { buildCourseSupportWhatsAppUrl } from "@/lib/support";
import styles from "./aulas-shell.module.css";

type AulasShellProps = {
  authOn: boolean;
  children: React.ReactNode;
  userEmail?: string | null;
  /** Libera a tab Admin no nav — só para a equipe Chat Jurídico */
  isAdmin?: boolean;
  /** false = comprou só o Degravação (nav sem catálogo e galeria). */
  hasCourse?: boolean;
};

export function AulasShell({
  authOn,
  children,
  userEmail,
  isAdmin,
  hasCourse,
}: AulasShellProps) {
  const supportUrl = buildCourseSupportWhatsAppUrl(userEmail);

  return (
    <div className={styles.shell}>
      <MembersShellHeader
        supportUrl={supportUrl}
        authOn={authOn}
        userEmail={userEmail}
        isAdmin={isAdmin}
        hasCourse={hasCourse}
      />

      <div className={styles.main}>{children}</div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <MembersFooterActions supportUrl={supportUrl} showSignOut={authOn} />
        </div>
      </footer>
    </div>
  );
}
