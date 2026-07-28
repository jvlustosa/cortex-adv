"use client";

import Link from "next/link";
import { UserMenu } from "@/components/aulas/user-menu";
import { useSessionUser } from "@/lib/auth/use-session";

// Ação secundária ao lado do CTA de compra: pill outline, mesma altura do
// botão de matrícula — não mais um link solto igual aos de navegação.
const linkClass =
  "hidden items-center rounded-full border border-[var(--border)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--foreground)]/25 hover:bg-[var(--surface)] sm:inline-flex";

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
