import Link from "next/link";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { LandingMobileMenu } from "@/components/landing-mobile-menu";
import { HeaderAuthCta } from "@/components/header-auth-cta";
import { HeaderBuyCta } from "@/components/header-buy-cta";
import { CourseEnrollment } from "@/components/course-enrollment";
import { CourseHero } from "@/components/course-hero";
import { PricingSection } from "@/components/sales/pricing-section";
import { isSignupEnabled } from "@/lib/supabase/enabled";
import {
  CHAT_JURIDICO_SOCIAL,
  CHAT_JURIDICO_URL,
  SITE_BRAND,
} from "@/lib/site";
import { AnimatedFeatureGrid } from "@/components/animated-feature-grid";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { InstagramIcon, YoutubeIcon } from "@/components/icons/social";
import { CommunityTiers } from "@/components/community-tiers";
import { FaqWhatsapp, type FaqItem } from "@/components/faq-whatsapp";
import { CertificatePreview } from "@/components/certificate-preview";
import { LaunchBanner } from "@/components/launch-banner";
import { MentorProfile } from "@/components/mentor-profile";
import { TrilhaSneakPeek } from "@/components/trilha-sneak-peek";
import { pageShellClass } from "@/lib/layout";
import { PRICING } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const faqItems: FaqItem[] = [
  {
    question: "O que é o Curso Claude Cowork para Advogados?",
    answer:
      "É o curso completo do Chat Jurídico pra dominar o Claude Cowork no escritório, com trilha em vídeo, certificado e Comunidade VIP de alunos. Você aprende a redigir peças com contexto do caso, automatizar follow-ups e ganhar horas de volta na semana, com supervisão humana em cada etapa.",
    reaction: "🤯",
  },
  {
    question: "Por que Claude e não ChatGPT?",
    answer:
      "Pra advocacia, o Claude lê documentos enormes de uma vez, segue instruções longas sem se perder e é mais cuidadoso com nuances: peça, contrato, parecer. No curso a gente mostra na prática onde cada ferramenta se destaca, mas o foco é o Claude como par na bancada.",
    reaction: "💡",
  },
  {
    question: "Preciso saber programar?",
    answer:
      "Não. O curso é pra quem nunca abriu um terminal. Tudo passo a passo, com exemplos reais de advocacia. Se você sabe usar o WhatsApp, consegue acompanhar.",
    reaction: "🙌",
  },
  {
    question: "Qual a diferença entre o grupo aberto e a Comunidade VIP?",
    answer:
      "São dois grupos no WhatsApp com propósitos diferentes. O grupo aberto é gratuito: qualquer advogado entra, troca dicas e recebe novidades do Claude Academy. A Comunidade VIP é exclusiva de quem compra o curso: dúvidas sobre as aulas, networking entre alunos e materiais extras. O VIP não substitui o aberto; são complementares.",
  },
  {
    question: "O que é o grupo aberto?",
    answer:
      "Comunidade gratuita no WhatsApp para advogados curiosos com IA. Dicas de prompt, avisos de lançamento e troca informal. Não dá acesso às aulas nem ao suporte do curso. Serve pra conhecer o movimento antes de comprar.",
  },
  {
    question: "O que é a Comunidade VIP?",
    answer:
      `Grupo exclusivo no WhatsApp só para alunos matriculados — fechado de propósito, pra garantir uma troca de alto nível entre quem realmente aplica. Incluído na compra do curso. Lá você tira dúvidas das aulas, troca experiências com quem já usa Claude no escritório e recebe conteúdo extra. As skills premium são liberadas após ${PRICING.guaranteeDays} dias da compra. O acesso ao grupo é imediato na matrícula.`,
  },
  {
    question: "Quanto custa o curso?",
    answer:
      "O curso é pago e inclui a Comunidade VIP. O grupo aberto continua gratuito para quem quiser só acompanhar. Quem entra na lista de espera recebe valor e condições de lançamento antes de todo mundo.",
    reaction: "✨",
  },
  {
    question: "Tem garantia de reembolso?",
    answer:
      "Sim. Você tem 8 dias a partir da compra pra assistir o curso e testar na prática. Se não valer a pena, devolvemos 100% do valor. É só pedir, sem burocracia.",
    reaction: "🛡️",
  },
  {
    question: "Quem pode participar?",
    answer:
      "Quem advoga, estagia, estuda direito ou toca a gestão de um escritório. Se você lida com peça, prazo ou cliente todo dia, o conteúdo foi feito pra você.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Sim. Login seguro, sem armazenar dados do seu escritório. O curso também ensina a usar IA respeitando sigilo profissional e a LGPD: o que pode e o que não pode ir pro prompt.",
    reaction: "🔒",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Curso Claude Cowork para Advogados",
  description:
    "Curso completo do Chat Jurídico para dominar o Claude no escritório. Trilha em vídeo, Comunidade VIP de alunos e certificado ao concluir.",
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
        <div
          className={cn(
            pageShellClass,
            "flex items-center justify-between gap-3 py-3 sm:gap-6 sm:py-4",
          )}
        >
          <ClaudeAcademyBrand size="sm" className="shrink sm:hidden" />
          <ClaudeAcademyBrand size="md" className="hidden shrink sm:flex" />
          <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <a
              href="#precos"
              className="hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline"
            >
              Preços
            </a>
            <Link
              href="/quiz"
              className="hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline"
            >
              Quiz
            </Link>
            <a
              href="#comunidade"
              className="hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline"
            >
              Comunidade
            </a>
            <HeaderAuthCta />
            <HeaderBuyCta />
            <LandingMobileMenu />
          </nav>
        </div>
      </header>

      <LaunchBanner />

      <main className="flex flex-1 flex-col">
        <CourseHero />

        <MentorProfile />

        <AnimatedFeatureGrid />

        <TrilhaSneakPeek />

        <CertificatePreview />

        <PricingSection />

        <CourseEnrollment />

        <section className="border-t border-[var(--border)] bg-[var(--surface-overlay)] px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <div className="inline-flex rounded-2xl bg-[var(--surface-raised)] p-3">
              <ShieldCheck className="size-7 text-[var(--accent)]" aria-hidden />
            </div>
            <h2 className="font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
              Garantia de 8 dias
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Comprou o curso e não ficou satisfeito? Nos primeiros 8 dias,
              devolvemos 100% do valor. Você testa na prática, sem risco. Se
              não valer a pena, é só pedir.
            </p>
          </div>
        </section>

        <section className="border-t border-[var(--border)] px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="mx-auto max-w-xl">
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Quiz · 2 minutos
            </p>
            <h2 className="mt-4 font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
              Você ainda usa Claude só pra fazer perguntas?
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              8 perguntas, 2 minutos. Descubra se você já usa IA no escritório
              de verdade — ou se ainda está no modo “pergunta e copia”.
            </p>
            <Link
              href="/quiz"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-8 py-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver meu nível
              <ArrowRight className="size-4 opacity-80 text-[var(--accent)]" aria-hidden />
            </Link>
          </div>
        </section>

        <CommunityTiers vipCtaHref="#precos" vipCtaLabel="Ver preços" />

        <FaqWhatsapp items={faqItems} heading="Perguntas frequentes" subtitle="Curso, grupo aberto e Comunidade VIP" />
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-8 sm:px-6">
        <div
          className={cn(
            pageShellClass,
            "flex flex-col items-center justify-between gap-6 text-center text-sm text-[var(--muted)] sm:flex-row sm:text-left",
          )}
        >
          <span>© {new Date().getFullYear()} {SITE_BRAND}</span>
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
              href="/area-de-membros"
              className="underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              Área de membros
            </Link>
          </div>
        </div>
        <div
          className={cn(
            pageShellClass,
            "mt-6 flex flex-col items-center gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] sm:flex-row sm:justify-between",
          )}
        >
          <div className="flex items-center gap-2">
            <span>Feito por</span>
            <a
              href={CHAT_JURIDICO_URL}
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
          <div className="flex items-center gap-2">
            <a
              href={CHAT_JURIDICO_SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do Chat Jurídico"
              className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)]/35 hover:text-[var(--foreground)]"
            >
              <InstagramIcon />
            </a>
            <a
              href={CHAT_JURIDICO_SOCIAL.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube do Chat Jurídico"
              className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)]/35 hover:text-[var(--foreground)]"
            >
              <YoutubeIcon />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
