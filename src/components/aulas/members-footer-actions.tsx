"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { SignOutButton } from "@/components/sign-out-button";
import styles from "./aulas-shell.module.css";

type MembersFooterActionsProps = {
  supportUrl: string;
  showSignOut?: boolean;
};

export function MembersFooterActions({
  supportUrl,
  showSignOut = true,
}: MembersFooterActionsProps) {
  return (
    <>
      <a
        href={supportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.supportBtn}
      >
        <WhatsAppIcon className="size-4" />
        Suporte
      </a>
      {showSignOut ? (
        <SignOutButton className={styles.signOutBtn} />
      ) : null}
    </>
  );
}
