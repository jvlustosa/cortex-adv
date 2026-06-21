"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { CircleUser, Menu, X } from "lucide-react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { SignOutButton } from "@/components/sign-out-button";
import styles from "./aulas-shell.module.css";

type MembersShellHeaderProps = {
  supportUrl: string;
  authOn: boolean;
  userEmail?: string | null;
  active?: "catalog" | "player";
};

export function MembersShellHeader({
  supportUrl,
  authOn,
  userEmail,
  active,
}: MembersShellHeaderProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, open]);

  const membersLinkClass =
    active === "catalog"
      ? `${styles.navLink} ${styles.navLinkActive}`
      : styles.navLink;

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <ClaudeAcademyBrand size="sm" />

        <nav className={styles.desktopNav} aria-label="Navegação da área de membros">
          <Link
            href="/area-de-membros"
            className={membersLinkClass}
            aria-current={active === "catalog" ? "page" : undefined}
          >
            Área de membros
          </Link>

          {authOn && userEmail ? (
            <span className={styles.userEmail} title={userEmail}>
              <CircleUser className="size-4 shrink-0" aria-hidden />
              <span className={styles.userEmailText}>{userEmail}</span>
            </span>
          ) : null}

          {authOn ? <SignOutButton className={styles.signOutBtn} /> : null}
        </nav>

        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {open ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Fechar menu"
          onClick={closeMenu}
        />
      ) : null}

      <nav
        id={menuId}
        className={`${styles.mobileNav} ${open ? styles.mobileNavOpen : ""}`}
        aria-label="Menu da área de membros"
        aria-hidden={!open}
      >
        {userEmail ? (
          <p className={styles.mobileUser} title={userEmail}>
            {userEmail}
          </p>
        ) : null}

        <Link
          href="/area-de-membros"
          className={membersLinkClass}
          aria-current={active === "catalog" ? "page" : undefined}
          onClick={closeMenu}
        >
          Área de membros
        </Link>

        <a
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mobileSupportLink}
          onClick={closeMenu}
        >
          <WhatsAppIcon className="size-4" />
          Suporte no WhatsApp
        </a>

        {authOn ? (
          <SignOutButton
            className={styles.mobileSignOutBtn}
            onSignedOut={closeMenu}
          />
        ) : null}
      </nav>
    </header>
  );
}
