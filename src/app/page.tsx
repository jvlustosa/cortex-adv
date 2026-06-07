import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { TrilhaSneakPeek } from "@/components/trilha-sneak-peek";
import { FeaturesSection } from "@/components/features-section";
import { HeroBackground } from "@/components/hero-background";
import { MentorSection } from "@/components/mentor-section";
import { SkillsDeepSection } from "@/components/skills-deep-section";
import { isSignupEnabled } from "@/lib/supabase/enabled";
import {
  BRAND_FULL,
  BRAND_LOGO_ALT,
  BRAND_LOGO_SRC,
  BRAND_SITE_URL,
  CHAT_JURIDICO_URL,
} from "@/lib/brand";
import { ArrowRight, KeyRound } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { FaqWhatsapp, type FaqItem } from "@/components/faq-whatsapp";

const faqItems: FaqItem[] = [
  {
    question: "O que é o Claude Academy?",
    answer:
      "O Claude Academy é o curso do Chat Jurídico para advogados. Microaulas em vídeo do básico ao avançado, com teto em Skills — prompts, documentos, Projects e biblioteca de skills com disciplina ética e antialucinação.",
    reaction: "🤯",
  },
  {
    question: "Qual a diferença do Claude pro ChatGPT?",
    answer:
      "Os dois são IAs, mas com perfis diferentes. O Claude é mais cuidadoso com nuances, segue instruções longas melhor e consegue ler documentos enormes de uma vez — ideal pra peças e contratos. O ChatGPT é mais popular e tem mais integrações. No curso, a gente mostra na prática onde cada um se destaca.",
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
      "É o canal principal da comunidade. Lá a gente compartilha dicas rápidas, novidades sobre IA, tira dúvidas em tempo real e troca experiências entre advogados e advogadas que já estão usando IA no escritório. É aberto — entra quem quiser.",
  },
  {
    question: "Quanto custa o curso?",
    answer:
      "O curso é pago — estamos finalizando o conteúdo e o valor será divulgado em breve. Quem estiver no grupo do WhatsApp vai saber primeiro.",
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
      "Sim. O login é seguro e não armazenamos dados do seu escritório. O curso também ensina boas práticas de uso de IA respeitando sigilo profissional e a LGPD.",
    reaction: "🔒",
  },
];

const whatsappUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/G2VXJ9UManZ77Rx7Uzn7NT";

const chatJuridicoUrl = CHAT_JURIDICO_URL;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Claude Academy — Curso de Claude para advogados",
  description:
    "Claude Academy by Chat Jurídico. Curso de Claude e IA generativa aplicada à advocacia — disponível em breve. Aprenda a automatizar peças, rotinas e comunicação do escritório.",
  url: BRAND_SITE_URL,
  provider: {
    "@type": "Organization",
    name: "Chat Jurídico",
    url: "https://chatjuridico.com.br",
  },
  isAccessibleForFree: false,
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
            <BrandLogo size="md" />
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
              className="ca-btn-primary px-4 py-2 text-sm"
            >
              <WhatsAppIcon className="size-4" />
              Entrar no grupo
            </a>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative flex min-h-[calc(100dvh-65px)] items-center justify-center overflow-hidden px-6 py-16 text-center md:py-24">
          <HeroBackground />
          <div className="relative z-10 mx-auto max-w-[480px]">
            <div className="mx-auto mb-8 flex size-[88px] items-center justify-center rounded-[24px] border border-[var(--accent)]/25 bg-[var(--accent-dim)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_LOGO_SRC}
                alt={BRAND_LOGO_ALT}
                width={64}
                height={64}
                className="size-full rounded-xl object-cover"
              />
            </div>

            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-dim)] px-4 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              <span className="ch-badge-dot size-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(217,119,87,0.6)]" />
              Primeira turma em breve
            </p>

            <h1 className="mt-7 font-serif text-[2.5rem] leading-[1.15] tracking-tight text-white md:text-[2.75rem]">
              Domine o <span className="ca-gradient-text">Claude</span> na advocacia
            </h1>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-white/55">
              O curso do Chat Jurídico para usar IA no escritório. Mentoria com{" "}
              <strong className="font-semibold text-[#fbcab1]">
                Dr. Marcos Vilas Boas
              </strong>
              .
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ca-btn-primary"
              >
                <WhatsAppIcon className="size-5" />
                Entrar no grupo do WhatsApp
                <ArrowRight className="size-4 opacity-80" aria-hidden />
              </a>
              <Link href="/login" className="ca-btn-ghost">
                <KeyRound className="size-5" aria-hidden />
                Área de membros
              </Link>
            </div>

            <p className="mt-6 text-[0.78rem] tracking-wide text-white/30">
              Sem spam. Avisamos só quando a turma abrir.
            </p>
          </div>
        </section>

        <MentorSection />
        <FeaturesSection />
        <SkillsDeepSection />

        <TrilhaSneakPeek />

        <section className="border-t border-[var(--border)] px-6 py-16 text-center">
          <div className="mx-auto max-w-xl">
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Quiz · 2 minutos
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
              className="ca-btn-primary mt-8"
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
          <span>
            © {new Date().getFullYear()}{" "}
            <a
              href={chatJuridicoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[var(--foreground)]"
            >
              {BRAND_FULL}
            </a>
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
            {isSignupEnabled() && (
              <Link
                href="/signup"
                className="underline underline-offset-4 hover:text-[var(--foreground)]"
              >
                Cadastro
              </Link>
            )}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              Área de membros
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
