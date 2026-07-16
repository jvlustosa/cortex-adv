"use client";

import Link from "next/link";
import { useIsAuthed } from "@/lib/auth/use-session";

const linkClass =
  "hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline";

/**
 * CTA de auth no header da landing. Com sessão ativa vira "Área de membros";
 * caso contrário (ou enquanto resolve) mantém o "Entrar" — preservando o
 * comportamento atual e a renderização estática da página.
 */
export function HeaderAuthCta() {
  const isAuthed = useIsAuthed();

  if (isAuthed) {
    return (
      <Link href="/area-de-membros" className={linkClass}>
        Área de membros
      </Link>
    );
  }

  return (
    <Link href="/login" className={linkClass}>
      Entrar
    </Link>
  );
}
