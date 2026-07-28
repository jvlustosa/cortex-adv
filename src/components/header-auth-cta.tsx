"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { UserMenu } from "@/components/aulas/user-menu";
import { useSessionUser } from "@/lib/auth/use-session";

// Ação secundária ao lado do CTA de compra: pill outline, mesma altura do
// botão de matrícula — não mais um link solto igual aos de navegação.
const linkClass =
  "hidden items-center rounded-full border border-[var(--border)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--foreground)]/25 hover:bg-[var(--surface)] sm:inline-flex";

/**
 * CTA de auth no header da landing. Com sessão ativa, o lugar do botão de
 * compra passa a ser o atalho pra área de membros: quem já é aluno chega na
 * landing e vê pra onde ir, sem precisar abrir o menu do perfil. Sem sessão
 * (ou enquanto resolve) mantém o "Entrar", preservando a renderização estática
 * da página. O UserMenu é só desktop (sm+); no mobile o estado logado aparece
 * no menu-drawer.
 */
export function HeaderAuthCta() {
  const user = useSessionUser();

  if (user) {
    return (
      <>
        <Link
          href="/area-de-membros"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)] sm:px-4"
        >
          <GraduationCap className="size-4 shrink-0" aria-hidden />
          <span className="sm:hidden">Membros</span>
          <span className="hidden sm:inline">Área de membros</span>
        </Link>
        <div className="hidden sm:block">
          <UserMenu userEmail={user.email ?? "Minha conta"} />
        </div>
      </>
    );
  }

  return (
    <Link href="/login" className={linkClass}>
      Entrar
    </Link>
  );
}
