import {
  FileText,
  MessageSquareText,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
const chips = [
  {
    icon: FileText,
    name: "Peças jurídicas em HTML/PDF",
    sub: "Petições, manifestações e recursos com timbrada",
  },
  {
    icon: PencilLine,
    name: "Edição cirúrgica",
    sub: "Reescreve trechos sem refazer o documento inteiro",
  },
  {
    icon: ShieldCheck,
    name: "Análise de contratos",
    sub: "Resumo executivo + pontos de atenção e cláusulas críticas",
  },
  {
    icon: MessageSquareText,
    name: "Triagem e follow-up",
    sub: "Atendimento padronizado e respostas no WhatsApp",
  },
  {
    icon: Zap,
    name: "Economia máxima de token",
    sub: "Skills otimizadas que reduzem consumo e custo por execução",
  },
  {
    icon: Sparkles,
    name: "Muito mais",
    sub: "Coletânea completa de skills do Claude Academy para alunos",
    exclusive: true,
  },
];

const points = [
  {
    num: "1",
    title: "Crie suas próprias skills",
    description:
      "Aprenda a empacotar fluxos do seu escritório em skills reutilizáveis pela equipe inteira",
  },
  {
    num: "2",
    title: "Use skills da comunidade",
    description:
      "Skills prontas e testadas por advogados, prontas para instalar e usar no mesmo dia",
  },
  {
    num: "3",
    title: "Integre ao Claude Cowork",
    description:
      "Execute skills direto no WhatsApp do escritório através do Claude Cowork do Chat Jurídico",
  },
];

export function SkillsDeepSection() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--border)] bg-gradient-to-b from-[var(--background)] to-[#110d0a] px-6 py-16 md:py-20">
      <div className="pointer-events-none absolute bottom-[-50px] left-[-80px] opacity-35">
        <div className="ca-orb ca-orb-2 !top-auto !right-auto" aria-hidden />
      </div>
      <div className="relative z-10 mx-auto max-w-[920px]">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
              Diferencial do curso
            </p>
            <h2 className="mt-3 font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-[2rem]">
              <span className="ca-gradient-text">Skills do Claude</span> instaladas
              no seu escritório
            </h2>
            <p className="mt-4 text-[var(--muted)] leading-relaxed">
              Skills são habilidades plugáveis que o Claude carrega sob demanda para
              tarefas jurídicas específicas. Em vez de reinventar prompts toda vez,
              você instala a skill certa e o Claude já sabe o que fazer, com
              instruções, exemplos e arquivos de referência prontos.
            </p>
          </div>

          <div className="rounded-[20px] border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent-dim)] to-[var(--surface)] p-5">
            {chips.map((chip) => (
              <div
                key={chip.name}
                className={`mb-2 flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition last:mb-0 hover:translate-x-0.5 ${
                  chip.exclusive
                    ? "border-[var(--accent)]/45 bg-gradient-to-br from-[var(--accent-dim)] to-[var(--surface)]"
                    : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent-dim)]"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    chip.exclusive
                      ? "bg-[var(--accent)]/30 text-[#fbcab1]"
                      : "bg-[var(--accent-dim)] text-[var(--accent)]"
                  }`}
                >
                  <chip.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[0.88rem] font-bold text-[var(--foreground)]">
                    {chip.name}
                    {chip.exclusive ? (
                      <span className="ml-2 inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent-dim)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--accent)]">
                        Pack exclusivo
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-[0.75rem] leading-snug text-[var(--muted)]">
                    {chip.sub}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((point) => (
            <article
              key={point.num}
              className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/20 hover:bg-[var(--accent-dim)]"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-dim)] text-[0.85rem] font-extrabold text-[var(--accent)]">
                {point.num}
              </span>
              <h4 className="mt-3 text-[0.95rem] font-bold text-[var(--foreground)]">
                {point.title}
              </h4>
              <p className="mt-1.5 text-[0.82rem] leading-relaxed text-[var(--muted)]">
                {point.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
