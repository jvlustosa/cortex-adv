"use client";

import Link from "next/link";
import { useSessionUser } from "@/lib/auth/use-session";

const linkClass =
  "rounded-lg px-2.5 py-2 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]";

/**
 * Links de marketing do header (Preços, Quiz, Comunidade). Escondidos quando há
 * sessão ativa — quem já é aluno navega pela área de membros, não pela página de
 * vendas; sobra só o menu do usuário (toggle da Área de membros). Client-side
 * (useSessionUser) pra manter a landing estática; enquanto resolve a sessão
 * mostra os links (caso comum: visitante deslogado), sem flash pra quem não
 * está logado.
 *
 * Ficam num grupo colado (gap curto + hover de fundo) e o divisor separa
 * navegação das ações (Entrar / matrícula) — some junto com os links quando há
 * sessão.
 */
export function HeaderMarketingNav() {
  const user = useSessionUser();
  if (user) return null;

  return (
    <div className="hidden items-center gap-0.5 sm:flex">
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
      <span aria-hidden className="ml-2 h-5 w-px bg-[var(--border)]" />
    </div>
  );
}
