import { cn } from "@/lib/utils";
import {
  AULA_FORMATO,
  CURSO_META,
  CURSO_NIVEIS,
  totalAulas,
  totalMinutos,
  type AulaBadge,
  type CursoNivel,
} from "@/data/curso-roteiro";

const BADGE_LABEL: Record<AulaBadge, string> = {
  gratis: "Amostra grátis",
  ancora: "Aula-âncora",
  entregavel: "Entregável",
  capstone: "Certificado",
};

type CursoCurriculumProps = {
  compact?: boolean;
  className?: string;
};

function levelLabel(nivel: CursoNivel): string {
  if (nivel.level === "bonus") return "Bônus";
  return `Nível ${nivel.level}`;
}

function Badge({ type }: { type: AulaBadge }) {
  return (
    <span className="shrink-0 rounded-full border border-[var(--accent)]/35 bg-[var(--accent-dim)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
      {BADGE_LABEL[type]}
    </span>
  );
}

export function CursoCurriculum({ compact = false, className }: CursoCurriculumProps) {
  const mins = totalMinutos();
  const hours = Math.floor(mins / 60);
  const remain = mins % 60;

  return (
    <div className={cn("space-y-10", className)}>
      {!compact && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Aulas", value: String(totalAulas()) },
              { label: "Duração", value: `${hours}h${remain.toString().padStart(2, "0")}` },
              { label: "Formato", value: "Screencast" },
              { label: "Teto", value: "Skills" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center"
              >
                <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                  {stat.label}
                </p>
                <p className="mt-1 font-serif text-xl text-[var(--foreground)]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {CURSO_META.philosophy}
            </p>
            <ul className="mt-4 space-y-2">
              {CURSO_META.threads.map((t) => (
                <li
                  key={t}
                  className="flex gap-2 text-sm text-[var(--foreground)]/90"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="space-y-8">
        {CURSO_NIVEIS.map((nivel) => (
          <section
            key={nivel.id}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] overflow-hidden"
          >
            <header className="border-b border-[var(--border)] bg-[var(--surface-overlay)] px-5 py-4 md:px-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-sm text-[var(--accent)]">
                  {levelLabel(nivel)}
                </span>
                <h3 className="font-serif text-lg text-[var(--foreground)] md:text-xl">
                  {nivel.title}
                </h3>
              </div>
              {nivel.subtitle && (
                <p className="mt-1 text-sm text-[var(--muted)]">{nivel.subtitle}</p>
              )}
            </header>

            <ol className="divide-y divide-[var(--border)]">
              {nivel.aulas.map((aula) => (
                <li
                  key={aula.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4 md:px-6"
                >
                  <span className="shrink-0 font-mono text-sm text-[var(--accent)] sm:w-10">
                    {aula.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--foreground)]">
                        {aula.title}
                      </p>
                      {aula.badge && <Badge type={aula.badge} />}
                    </div>
                    {!compact && (
                      <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                        {aula.objective}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted)] sm:text-right">
                    {aula.minutes} min
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {!compact && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Trilha rápida
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {CURSO_META.tracks.rapida}
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent-dim)] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Trilha completa
            </p>
            <p className="mt-2 text-sm text-[var(--foreground)]/90">
              {CURSO_META.tracks.completa}
            </p>
          </div>
        </div>
      )}

      {!compact && (
        <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-overlay)] p-5 md:p-6">
          <h3 className="font-serif text-lg text-[var(--foreground)]">
            Formato de cada aula — 5 batidas
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Microaulas de {CURSO_META.lessonDuration}. Estrutura fixa que o aluno
            reconhece de cara.
          </p>
          <ol className="mt-5 space-y-3">
            {AULA_FORMATO.map((b) => (
              <li key={b.step} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--accent-dim)] font-mono text-xs font-bold text-[var(--accent)]">
                  {b.step}
                </span>
                <div>
                  <span className="font-medium text-[var(--foreground)]">
                    {b.label}
                  </span>
                  <span className="text-[var(--muted)]"> — {b.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
