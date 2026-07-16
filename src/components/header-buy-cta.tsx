"use client";

import { useSessionUser } from "@/lib/auth/use-session";

/**
 * CTA de compra do header. Escondido quando há sessão ativa — quem já é aluno
 * não precisa do "Garantir vaga". Client-side (useSessionUser) pra manter a
 * landing estática; enquanto resolve a sessão, mostra o botão (caso comum:
 * visitante deslogado), sem flash pra quem não está logado.
 */
export function HeaderBuyCta() {
  const user = useSessionUser();
  if (user) return null;

  return (
    <a
      href="#lista-espera"
      className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)] sm:px-4"
    >
      <span className="sm:hidden">Vaga</span>
      <span className="hidden sm:inline">Garantir vaga</span>
    </a>
  );
}
