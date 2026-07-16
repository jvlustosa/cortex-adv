"use client";

import Link from "next/link";
import { UserMenu } from "@/components/aulas/user-menu";
import { useSessionUser } from "@/lib/auth/use-session";

const linkClass =
  "hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline";

/**
 * CTA de auth no header da landing. Com sessão ativa mostra o UserMenu (mesmo
 * indicador de "logado" da área de membros: e-mail + "Sair"); caso contrário
 * (ou enquanto resolve) mantém o "Entrar" — preservando o comportamento atual
 * e a renderização estática da página. Só no desktop (sm+); no mobile o estado
 * logado aparece no menu-drawer.
 */
export function HeaderAuthCta() {
  const user = useSessionUser();

  if (user) {
    return (
      <div className="hidden sm:block">
        <UserMenu
          userEmail={user.email ?? "Minha conta"}
          membersHref="/area-de-membros"
        />
      </div>
    );
  }

  return (
    <Link href="/login" className={linkClass}>
      Entrar
    </Link>
  );
}
