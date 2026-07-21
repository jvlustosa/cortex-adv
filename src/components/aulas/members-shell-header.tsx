"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { SignOutButton } from "@/components/sign-out-button";
import { UserMenu } from "./user-menu";
import styles from "./aulas-shell.module.css";

// Detecta o client sem setState-em-effect (false no SSR, true após hidratar).
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

type MembersShellHeaderProps = {
  supportUrl: string;
  authOn: boolean;
  userEmail?: string | null;
  isAdmin?: boolean;
};

// Deriva a aba ativa da rota atual — o header vive no layout compartilhado e
// não recebe mais `active` por page.
function useActiveTab(): "catalog" | "player" | "packs" | undefined {
  const pathname = usePathname();
  if (pathname.startsWith("/area-de-membros/packs")) return "packs";
  if (pathname === "/area-de-membros") return "catalog";
  if (pathname.startsWith("/aulas")) return "player";
  return undefined;
}

export function MembersShellHeader({
  supportUrl,
  authOn,
  userEmail,
  isAdmin,
}: MembersShellHeaderProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const active = useActiveTab();

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

  const packsLinkClass =
    active === "packs"
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

          <Link
            href="/area-de-membros/packs"
            className={packsLinkClass}
            aria-current={active === "packs" ? "page" : undefined}
          >
            Galeria
          </Link>

          {isAdmin ? (
            <Link
              href="/admin"
              className={`${styles.navLink} ${styles.adminLink}`}
            >
              Admin
              <span className={styles.adminCaption}>
                Apenas para a equipe Chat Jurídico
              </span>
            </Link>
          ) : null}

          {authOn ? (
            userEmail ? (
              <UserMenu userEmail={userEmail} />
            ) : (
              <SignOutButton className={styles.signOutBtn} />
            )
          ) : null}
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

      {/* Drawer + backdrop em portal no body: o `backdrop-filter` do header cria
          containing block e o `fixed` do drawer escaparia do clip do body,
          gerando scroll horizontal fantasma no mobile (mesmo padrão da landing). */}
      {mounted
        ? createPortal(
            <>
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

                <Link
                  href="/area-de-membros/packs"
                  className={packsLinkClass}
                  aria-current={active === "packs" ? "page" : undefined}
                  onClick={closeMenu}
                >
                  Galeria
                </Link>

                {isAdmin ? (
                  <Link
                    href="/admin"
                    className={`${styles.navLink} ${styles.adminLink}`}
                    onClick={closeMenu}
                  >
                    Admin
                    <span className={styles.adminCaption}>
                      Apenas para a equipe Chat Jurídico
                    </span>
                  </Link>
                ) : null}

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
            </>,
            document.body,
          )
        : null}
    </header>
  );
}
