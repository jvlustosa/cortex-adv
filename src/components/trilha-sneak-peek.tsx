import Link from "next/link";
import { ArrowRight, Lock, KeyRound } from "lucide-react";
import {
  TRILHA_NIVEIS_PUBLIC,
  TRILHA_PUBLIC_META,
} from "@/data/curso-trilha-public";
import { cn } from "@/lib/utils";

type TrilhaSneakPeekProps = {
  className?: string;
  showCta?: boolean;
};

export function TrilhaSneakPeek({ className, showCta = true }: TrilhaSneakPeekProps) {
  return (
    <section
      id="trilha"
      className={cn("border-t border-[var(--border)] px-6 py-16 scroll-mt-20", className)}
    >
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            {TRILHA_PUBLIC_META.kicker}
          </p>
          <h2 className="mt-3 font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
            {TRILHA_PUBLIC_META.title}
          </h2>
          <p className="mt-3 text-[var(--muted)]">{TRILHA_PUBLIC_META.subtitle}</p>
          <p className="mt-2 text-sm text-[var(--muted)]/80">
            {TRILHA_PUBLIC_META.duration} · {TRILHA_PUBLIC_META.format}
          </p>
        </div>

        <ol className="relative mt-10 space-y-0">
          <div
            className="absolute left-[1.125rem] top-3 bottom-3 w-px bg-gradient-to-b from-[var(--accent)]/50 via-[var(--border)] to-[var(--border)]"
            aria-hidden
          />
          {TRILHA_NIVEIS_PUBLIC.map((nivel, index) => (
            <li key={nivel.level} className="relative flex gap-4 pb-6 last:pb-0">
              <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-dim)] text-sm font-extrabold text-[var(--accent)]">
                {nivel.level}
              </span>
              <div className="min-w-0 flex-1 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold tracking-tight text-[var(--foreground)]">
                    {nivel.title}
                  </h3>
                  {index > 0 ? (
                    <Lock
                      className="size-3.5 shrink-0 text-[var(--muted)]/60"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  {nivel.teaser}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {showCta ? (
          <div className="mt-10 rounded-[var(--radius)] border border-[var(--accent)]/20 bg-[var(--accent-dim)] px-5 py-5 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Roteiro completo, aulas e materiais — só na área de membros
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Quem entra na turma acessa cada microaula com vídeo, prompts e entregáveis.
            </p>
            <Link
              href="/login"
              className="ca-btn-primary mt-5 inline-flex"
            >
              <KeyRound className="size-4" aria-hidden />
              Acessar área de membros
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
