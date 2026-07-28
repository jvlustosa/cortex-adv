"use client";

import { useSessionUser } from "@/lib/auth/use-session";
import { SALES_MODE } from "@/lib/launch-window";

/**
 * CTA de compra do header. Escondido quando há sessão ativa — quem já é aluno
 * não precisa do botão. Client-side (useSessionUser) pra manter a landing
 * estática; enquanto resolve a sessão, mostra o botão (caso comum: visitante
 * deslogado), sem flash pra quem não está logado.
 *
 * No perpétuo aponta pro preço (matrícula aberta); em modo turma continua indo
 * pra lista de espera, que é o destino certo fora da janela.
 */
export function HeaderBuyCta() {
  const user = useSessionUser();
  if (user) return null;

  const isEvergreen = SALES_MODE === "evergreen";

  return (
    <a
      href={isEvergreen ? "#precos" : "#lista-espera"}
      className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)] sm:px-4"
    >
      <span className="sm:hidden">{isEvergreen ? "Matrícula" : "Vaga"}</span>
      <span className="hidden sm:inline">
        {isEvergreen ? "Fazer matrícula" : "Garantir vaga"}
      </span>
    </a>
  );
}
