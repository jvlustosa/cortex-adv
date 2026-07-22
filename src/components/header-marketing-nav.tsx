"use client";

import Link from "next/link";
import { useSessionUser } from "@/lib/auth/use-session";

const linkClass =
  "hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline";

/**
 * Links de marketing do header (Preços, Quiz, Comunidade). Escondidos quando há
 * sessão ativa — quem já é aluno navega pela área de membros, não pela página de
 * vendas; sobra só o menu do usuário (toggle da Área de membros). Client-side
 * (useSessionUser) pra manter a landing estática; enquanto resolve a sessão
 * mostra os links (caso comum: visitante deslogado), sem flash pra quem não
 * está logado.
 */
export function HeaderMarketingNav() {
  const user = useSessionUser();
  if (user) return null;

  return (
    <>
      <a href="#precos" className={linkClass}>
        Preços
      </a>
      <Link href="/simulador-custo-claude" className={linkClass}>
        Simulador
      </Link>
      <Link href="/quiz" className={linkClass}>
        Quiz
      </Link>
      <a href="#comunidade" className={linkClass}>
        Comunidade
      </a>
    </>
  );
}
