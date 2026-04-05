import Link from "next/link";
import { AIOrb } from "@/components/ai-orb";
import { ArrowRight, KeyRound, Zap, FileText, BarChart3, Search, Calendar, Users } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { FaqWhatsapp, type FaqItem } from "@/components/faq-whatsapp";

const faqItems: FaqItem[] = [
  {
    question: "O que é o Cortex e o mini curso?",
    answer:
      "O Cortex é uma comunidade e mini curso para advogados e advogadas que querem usar IA generativa — especialmente o Claude — no dia a dia do escritório. Você aprende a montar prompts, automatizar rotinas e integrar IA na sua prática jurídica, do zero.",
    reaction: "🤯",
  },
  {
    question: "Qual a diferença do Claude pro ChatGPT?",
    answer:
      "Os dois são IAs generativas, mas com perfis diferentes. O Claude tende a ser mais cuidadoso com nuances, segue instruções longas com mais fidelidade e tem uma janela de contexto enorme — ideal pra quem trabalha com peças e contratos extensos. O ChatGPT tem um ecossistema maior de plugins e é mais conhecido. No curso, a gente mostra na prática onde cada um se destaca e por que o Claude costuma entregar mais no contexto jurídico.",
    reaction: "💡",
  },
  {
    question: "Preciso saber programar?",
    answer:
      "Não. O curso foi pensado pra quem nunca abriu um terminal. Tudo é explicado passo a passo, com exemplos práticos de advocacia. Se você sabe usar o WhatsApp, consegue acompanhar.",
    reaction: "🙌",
  },
  {
    question: "O que tem no grupo do WhatsApp?",
    answer:
      "É o canal principal da comunidade. Lá a gente compartilha dicas rápidas, novidades sobre IA, tira dúvidas em tempo real e troca experiências entre advogados e advogadas que já estão usando IA no escritório. É gratuito e aberto.",
  },
  {
    question: "O mini curso é gratuito?",
    answer:
      "Sim, o acesso ao mini curso é gratuito. Você recebe um convite com login e senha para a área de membros. O conteúdo fica disponível no seu ritmo — sem prazo pra terminar.",
    reaction: "✨",
  },
  {
    question: "Quem pode participar?",
    answer:
      "Qualquer pessoa da área jurídica: advogados, advogadas, estagiários, estudantes de direito, gestores de escritório. O conteúdo é prático e pensado pra quem quer ganhar tempo e qualidade no trabalho com ajuda de IA.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Sim. O login é feito via Supabase com autenticação segura. Não armazenamos dados sensíveis do seu escritório. O curso ensina boas práticas de uso de IA respeitando sigilo profissional e a LGPD.",
    reaction: "🔒",
  },
];

const whatsappUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/G2VXJ9UManZ77Rx7Uzn7NT";

const skills = [
  {
    icon: FileText,
    title: "Geração de peças",
    description:
      "Petições iniciais, contestações e recursos com base no contexto do caso. O Claude lê documentos longos e mantém coerência do começo ao fim.",
    example: '"Monte uma contestação com base nessa inicial de 40 páginas"',
  },
  {
    icon: Search,
    title: "Pesquisa jurídica",
    description:
      "Busca inteligente em jurisprudência, doutrina e legislação. Resume decisões e destaca os argumentos relevantes pro seu caso.",
    example: '"Encontre precedentes do STJ sobre dano moral em relação de consumo"',
  },
  {
    icon: Zap,
    title: "Automação de rotinas",
    description:
      "Follow-ups, classificação de leads, resumos diários e relatórios automáticos. O Claude executa fluxos inteiros do escritório.",
    example: '"Envie follow-up para os leads que não responderam em 48h"',
  },
  {
    icon: BarChart3,
    title: "Relatórios e análises",
    description:
      "Visão completa do pipeline, métricas de leads e resumo de atividades. Dados do escritório organizados em segundos.",
    example: '"Me dê o resumo do pipeline e conversas pendentes de hoje"',
  },
  {
    icon: Calendar,
    title: "Gestão de prazos",
    description:
      "Controle de prazos processuais, agendamento de tarefas e lembretes automáticos. Nunca mais perca um prazo por esquecimento.",
    example: '"Quais prazos vencem essa semana e o que preciso preparar?"',
  },
  {
    icon: Users,
    title: "Comunicação com clientes",
    description:
      "Rascunhos de mensagens, respostas a dúvidas frequentes e atualização de status dos casos — tudo no tom do seu escritório.",
    example: '"Prepare uma atualização pro cliente sobre o andamento do processo"',
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Claude Cowork para advogados — Mini curso de IA generativa",
  description:
    "Mini curso gratuito sobre Claude e IA generativa aplicada à advocacia. Aprenda a automatizar peças, rotinas e comunicação do escritório.",
  provider: {
    "@type": "Organization",
    name: "Cortex.adv.br",
    url: "https://cortex.adv.br",
  },
  isAccessibleForFree: true,
  inLanguage: "pt-BR",
  audience: {
    "@type": "Audience",
    audienceType: "Advogados e profissionais do direito",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <AIOrb size="md" />
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-xl tracking-tight text-[var(--foreground)]">
                Cortex
              </span>
              <span className="text-xs text-[var(--muted)]">cortex.adv.br</span>
            </div>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/quiz"
              className="hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline"
            >
              Quiz
            </Link>
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline"
            >
              Entrar
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
            >
              <WhatsAppIcon className="size-4" />
              Entrar no grupo
            </a>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-40"
            aria-hidden
          >
            <div className="absolute -top-32 left-1/2 h-96 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--accent)]/10 to-transparent blur-[100px]" />
          </div>
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
                Mini curso gratuito · Comunidade no WhatsApp
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-[1.08] tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[3.35rem]">
                IA generativa para advogados
              </h1>
              <p className="mt-5 max-w-xl text-xl font-medium leading-snug text-[var(--foreground)]/95 md:text-2xl">
                Aprenda a usar o Claude no seu escritório
              </p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
                Prompts, automações e fluxos completos — do zero ao avançado.
                Entre no grupo do WhatsApp para trocar com outros advogados e
                acesse o mini curso gratuito na área de membros.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-medium text-[var(--background)] shadow-sm transition hover:bg-[var(--accent-hover)]"
                >
                  <WhatsAppIcon className="size-5" />
                  Entrar no grupo do WhatsApp
                  <ArrowRight className="size-4 opacity-80" aria-hidden />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/35"
                >
                  <KeyRound className="size-5 text-[var(--muted)]" aria-hidden />
                  Área de membros
                </Link>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative flex flex-col items-center rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 shadow-[0_0_40px_-12px_var(--accent)/15]">
                <AIOrb size="lg" />
                <p className="mt-8 text-center font-serif text-xl text-[var(--foreground)]">
                  Claude Cowork
                </p>
                <p className="mt-2 max-w-xs text-center text-sm text-[var(--muted)]">
                  Do primeiro prompt ao fluxo completo do escritório.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface-overlay)] px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
              O que o Claude faz pelo seu escritório
            </h2>
            <p className="mt-3 text-center text-[var(--muted)]">
              Skills reais que você aprende no curso e aplica no dia a dia
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <article
                  key={skill.title}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition hover:border-[var(--accent)]/30"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-[var(--surface-raised)] p-2.5">
                    <skill.icon className="size-5 text-[var(--accent)]" aria-hidden />
                  </div>
                  <h3 className="font-serif text-lg text-[var(--foreground)]">
                    {skill.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {skill.description}
                  </p>
                  <p className="mt-3 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs italic text-[var(--muted)]">
                    {skill.example}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] px-6 py-16 text-center">
          <div className="mx-auto max-w-xl">
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Quiz gratuito · 2 minutos
            </p>
            <h2 className="mt-4 font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
              Quão atualizado você está com IA?
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Ferramentas, agentes e automação — descubra se você está
              acompanhando ou ficando pra trás.
            </p>
            <Link
              href="/quiz"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-8 py-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Fazer o quiz
              <ArrowRight className="size-4 opacity-80 text-[var(--accent)]" aria-hidden />
            </Link>
          </div>
        </section>

        <FaqWhatsapp items={faqItems} heading="Perguntas frequentes" subtitle="Tire suas dúvidas sobre o curso e a comunidade" />

        <section className="border-t border-[var(--border)] px-6 py-16 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
              Entre na comunidade
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Advogados e advogadas trocando experiências sobre IA no escritório.
              Gratuito e aberto.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-medium text-[var(--background)] shadow-sm transition hover:bg-[var(--accent-hover)]"
            >
              <WhatsAppIcon className="size-5" />
              Entrar no grupo do WhatsApp
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center text-sm text-[var(--muted)] sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} Cortex.adv.br</span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
            <Link
              href="/signup"
              className="underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              Cadastro com convite
            </Link>
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              Área de membros
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-6 flex max-w-5xl items-center justify-center gap-2 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          <span>Feito por</span>
          <a
            href="https://chatjuridico.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-[var(--foreground)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/chat-juridico-logo-white.svg"
              alt="Chat Jurídico"
              className="h-5 opacity-70 transition hover:opacity-100"
            />
          </a>
        </div>
      </footer>
    </div>
  );
}
