import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, KeyRound, Plug, Sparkles } from "lucide-react";
import {
  TRILHA_NIVEIS_PUBLIC,
  TRILHA_PUBLIC_META,
} from "@/data/curso-trilha-public";
import { SEASON_COVER_IMAGES } from "@/lib/course/module-covers";
import { PRICING } from "@/lib/pricing";
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
              <div className="flex min-w-0 flex-1 gap-3.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
                <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] sm:w-16">
                  <Image
                    src={SEASON_COVER_IMAGES[index] ?? SEASON_COVER_IMAGES[0]}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold tracking-tight text-[var(--foreground)]">
                      {nivel.title}
                    </h3>
                    {nivel.premium ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--accent)]/35 bg-[var(--accent-dim)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                        <Lock className="size-3" aria-hidden />
                        Premium
                      </span>
                    ) : null}
                  </div>
                  {nivel.premium ? (
                    <p
                      className="mt-1 select-none text-sm leading-relaxed text-[var(--muted)] blur-[5px]"
                      aria-hidden
                    >
                      {nivel.teaser}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                      {nivel.teaser}
                    </p>
                  )}
                  {nivel.premium ? (
                    <span className="sr-only">
                      Conteúdo premium disponível para alunos matriculados.
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex items-start gap-4 rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent-dim)] px-5 py-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--background)] text-[var(--accent)]">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">
              Pack de Skills premium incluso
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground)]/90">
              As skills jurídicas prontas do curso, instaláveis direto no seu
              Claude — triagem, minuta e análise de contrato no seu formato.
              Liberado para quem assina, após os {PRICING.guaranteeDays} dias de
              garantia.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-4 rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent-dim)] px-5 py-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--background)] text-[var(--accent)]">
            <Plug className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">
              Pack de Conectores incluso
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground)]/90">
              Conectores que ligam o Claude aos sistemas do dia a dia — inclui o
              Conector de Publicações do DJEN, para puxar intimações direto na
              conversa. Liberado junto com as skills, após os{" "}
              {PRICING.guaranteeDays} dias de garantia.
            </p>
          </div>
        </div>

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
