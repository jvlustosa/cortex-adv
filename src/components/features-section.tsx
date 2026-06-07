import {
  Award,
  Layers,
  MessageSquare,
  Play,
  Scale,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Play,
    title: "Aulas práticas em vídeo",
    description:
      "Trilhas curtas e objetivas, com exemplos reais do dia a dia da advocacia",
  },
  {
    icon: MessageSquare,
    title: "Biblioteca de prompts",
    description:
      "Prompts testados para petições, atendimento, contratos e gestão do escritório",
  },
  {
    icon: Layers,
    title: "Skills prontos",
    description:
      "Habilidades plugáveis para automatizar tarefas repetitivas do escritório",
  },
  {
    icon: Scale,
    title: "Casos reais da advocacia",
    description:
      "Estudos práticos: triagem, follow-up, análise de contratos e mais",
  },
  {
    icon: Users,
    title: "Comunidade exclusiva",
    description:
      "Grupo de alunos para tirar dúvidas, compartilhar prompts e trocar experiências",
  },
  {
    icon: Award,
    title: "Certificado de conclusão",
    description:
      "Comprove a expertise em Claude para advocacia no LinkedIn e no escritório",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t border-[var(--border)] px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[920px] text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          O que você vai dominar
        </p>
        <h2 className="mt-3 font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-[1.85rem]">
          Claude na prática para advogados
        </h2>
        <p className="mx-auto mt-3 max-w-[540px] text-[var(--muted)]">
          Um currículo construído por advogados que usam Claude todos os dias no
          escritório. Sem teoria solta, só o que funciona.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center transition hover:-translate-y-0.5 hover:border-[var(--accent)]/20 hover:bg-[var(--accent-dim)]"
            >
              <div className="mx-auto mb-3.5 flex h-10 items-center justify-center">
                <feature.icon className="size-9 text-[var(--accent)]" aria-hidden />
              </div>
              <h3 className="text-[0.92rem] font-bold tracking-tight text-[var(--foreground)]">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[0.8rem] leading-relaxed text-[var(--muted)]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
