"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, CircleUser } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import styles from "./aulas-shell.module.css";

type UserMenuProps = {
  userEmail: string;
};

export function UserMenu({ userEmail }: UserMenuProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  return (
    <div className={styles.userMenu} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.userMenuTrigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <CircleUser className="size-4 shrink-0" aria-hidden />
        <span className={styles.userMenuEmail}>{userEmail}</span>
        <ChevronDown
          className={`size-4 shrink-0 ${styles.userMenuChevron} ${
            open ? styles.userMenuChevronOpen : ""
          }`}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        className={`${styles.userMenuPanel} ${
          open ? styles.userMenuPanelOpen : ""
        }`}
        inert={!open}
      >
        <p className={styles.userMenuLabel}>
          <span className={styles.userMenuLabelCaption}>Conectado como</span>
          <span className={styles.userMenuLabelEmail} title={userEmail}>
            {userEmail}
          </span>
        </p>
        <SignOutButton
          className={styles.userMenuItem}
          onSignedOut={close}
          showIcon
        />
      </div>
    </div>
  );
}
