import { MembersFooterActions } from "@/components/aulas/members-footer-actions";
import { MembersShellHeader } from "@/components/aulas/members-shell-header";
import { buildCourseSupportWhatsAppUrl } from "@/lib/support";
import styles from "./aulas-shell.module.css";

type AulasShellProps = {
  authOn: boolean;
  children: React.ReactNode;
  userEmail?: string | null;
  /** Destaque no nav: catálogo, player ou packs */
  active?: "catalog" | "player" | "packs";
  /** Libera a tab Admin no nav — só para a equipe Chat Jurídico */
  isAdmin?: boolean;
};

export function AulasShell({
  authOn,
  children,
  userEmail,
  active,
  isAdmin,
}: AulasShellProps) {
  const supportUrl = buildCourseSupportWhatsAppUrl(userEmail);

  return (
    <div className={styles.shell}>
      <MembersShellHeader
        supportUrl={supportUrl}
        authOn={authOn}
        userEmail={userEmail}
        active={active}
        isAdmin={isAdmin}
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
