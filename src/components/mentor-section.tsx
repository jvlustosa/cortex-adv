import {
  Briefcase,
  Code2,
  GraduationCap,
  Landmark,
  Mic,
} from "lucide-react";
const creds = [
  { icon: Briefcase, label: "11 anos de advocacia" },
  { icon: Code2, label: "Programador de software" },
  { icon: GraduationCap, label: "PUC · FGV" },
  { icon: Landmark, label: "Conselheiro do Contribuinte" },
  { icon: Mic, label: "Masterclass semanal" },
];

export function MentorSection() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--border)] bg-gradient-to-b from-[#110d0a] to-[var(--background)] px-6 py-16 md:py-20">
      <div className="pointer-events-none absolute bottom-[-100px] right-[-100px] opacity-25">
        <div className="ca-orb ca-orb-1 !top-auto !left-auto" aria-hidden />
      </div>
      <div className="relative z-10 mx-auto max-w-[920px]">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
            Seu Mentor
          </p>
          <h2 className="mt-3 font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-[2rem]">
            Aprenda com quem aplica no dia a dia
          </h2>
        </div>

        <div className="mt-10 grid items-center gap-8 rounded-[24px] border border-[var(--accent)]/20 bg-[var(--surface)] p-6 shadow-[0_10px_40px_rgba(217,119,87,0.08)] md:grid-cols-[280px_1fr] md:gap-10 md:p-9">
          <div className="relative mx-auto size-[220px] shrink-0 overflow-hidden rounded-[20px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] shadow-[0_12px_32px_rgba(217,119,87,0.35)] md:mx-0 md:size-[280px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/lp/masterclass-speaker-marcos-vilas-boas.jpg"
              alt="Dr. Marcos Vilas Boas"
              width={280}
              height={280}
              className="size-full object-cover [filter:sepia(35%)_saturate(1.15)_contrast(1.02)_brightness(1.02)_hue-rotate(-8deg)]"
              loading="lazy"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent)]/18 via-transparent to-[var(--accent-hover)]/20 mix-blend-soft-light"
              aria-hidden
            />
            <div
              className="ca-mentor-glow pointer-events-none absolute -inset-0.5 -z-10 rounded-[22px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] opacity-50 blur-[20px]"
              aria-hidden
            />
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-serif text-[1.75rem] tracking-tight text-[var(--foreground)]">
              Dr. Marcos Vilas Boas
            </h3>
            <span className="mt-2 inline-block rounded-full border border-[var(--accent)]/25 bg-[var(--accent-dim)] px-3.5 py-1 text-[0.82rem] font-semibold text-[var(--accent)]">
              Advogado empresarial, tributarista e programador
            </span>
            <p className="mt-4 text-[0.97rem] leading-relaxed text-[var(--muted)]">
              11 anos de advocacia e também programador de software. Especialista
              em Direito Tributário (PUC), Direito Empresarial (FGV) e Holdings e
              Planejamento Sucessório. Usa o Claude e o Claude Cowork no dia a dia
              para automatizar rotinas operacionais do escritório e ensina os
              mesmos fluxos no Claude Academy.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
              {creds.map((cred) => (
                <span
                  key={cred.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[0.78rem] text-[var(--foreground)]/75"
                >
                  <cred.icon className="size-3.5 text-[var(--accent)]" aria-hidden />
                  {cred.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
