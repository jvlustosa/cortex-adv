import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { CourseRoadmap } from "@/components/sales/course-roadmap";
import { PricingSection } from "@/components/sales/pricing-section";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { COURSE } from "@/data/course-content";
import {
  formatBRL,
  getPricingSummary,
  PRICING,
} from "@/lib/pricing";
import { CommunityTiers } from "@/components/community-tiers";
import { OPEN_WHATSAPP_GROUP_URL, SITE_BRAND } from "@/lib/site";

const { upfront } = getPricingSummary();

export const metadata: Metadata = {
  title: "Curso Claude Cowork para Advogados | Garanta sua vaga",
  description: `Domine o Claude Cowork no escritório. ${COURSE.modules.length} módulos, trilha completa. A partir de 12× ${formatBRL(PRICING.installments.amount)} ou ${formatBRL(upfront)} à vista.`,
};

export default function CursoSalesPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl min-w-0 items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
          <ClaudeAcademyBrand size="sm" showHost className="shrink sm:hidden" />
          <ClaudeAcademyBrand
            size="md"
            showHost
            className="hidden shrink sm:flex"
          />
          <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <Link
              href="/"
              className="hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline"
            >
              Início
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-4 pt-12 pb-14 sm:px-6 sm:pt-14 sm:pb-16 md:pt-20 md:pb-20">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-40"
            aria-hidden
          >
            <div className="absolute -top-32 left-1/2 h-96 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,119,87,0.14)_0%,transparent_70%)] blur-[100px]" />
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
              {COURSE.subtitle}
            </p>
            <h1 className="mt-4 font-serif text-[clamp(1.75rem,6vw,3rem)] leading-[1.08] tracking-tight text-balance text-[var(--foreground)]">
              {COURSE.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted)] sm:text-lg md:text-xl">
              O curso completo do Chat Jurídico: domine o Claude Cowork na
              bancada, com peças, rotinas automatizadas e uso ético, sem
              programar.
            </p>
            <p className="mt-8 font-serif text-[clamp(1.75rem,5vw,2.25rem)] text-[var(--foreground)]">
              12× {formatBRL(PRICING.installments.amount)}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              ou {formatBRL(upfront)} à vista ·{" "}
              {PRICING.upfrontDiscountPercent}% de desconto
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="#precos"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-medium text-[var(--background)] shadow-sm transition hover:bg-[var(--accent-hover)] sm:w-auto sm:max-w-none sm:px-8"
              >
                Garantir minha vaga
                <ArrowRight className="size-4 opacity-80" aria-hidden />
              </a>
              <a
                href={OPEN_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/35 sm:w-auto sm:max-w-none sm:px-8"
              >
                <WhatsAppIcon className="size-4" />
                Grupo aberto
              </a>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
              <ShieldCheck
                className="size-4 shrink-0 text-[var(--accent)]"
                aria-hidden
              />
              {PRICING.guaranteeDays} dias de garantia · reembolso integral
            </p>
          </div>
        </section>

        <CourseRoadmap />

        <CommunityTiers vipCtaHref="#precos" vipCtaLabel="Ver preços do curso" />

        <div id="precos">
          <PricingSection />
        </div>
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center text-sm text-[var(--muted)] sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} {SITE_BRAND}</span>
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-[var(--foreground)]"
          >
            Voltar ao início
          </Link>
        </div>
      </footer>
    </div>
  );
}
