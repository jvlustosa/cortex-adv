import Link from "next/link";
import { ArrowRight, AudioLines } from "lucide-react";

/** Aviso do bônus para quem tem o curso: o Degravação já está incluído. */
export function DegravacaoBonusCard() {
  return (
    <Link
      href="/area-de-membros/degravacao"
      className="mb-6 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]/40"
    >
      <span className="inline-flex shrink-0 rounded-xl bg-[var(--surface-raised)] p-3">
        <AudioLines className="size-5 text-[var(--accent)]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[var(--foreground)]">
          Incluído no curso: Degravação com Claude
        </span>
        <span className="mt-1 block text-sm text-[var(--muted)]">
          Audiência, depoimento ou reunião vira degravação com minutagem, no seu
          computador.
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-[var(--muted)]" aria-hidden />
    </Link>
  );
}
