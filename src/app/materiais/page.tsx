import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { FreeMaterialsGrid } from "@/components/free-materials-grid";
import { HeaderBuyCta } from "@/components/header-buy-cta";
import { loadPublishedFreeMaterials } from "@/lib/materials/storage";
import { pageShellClass } from "@/lib/layout";
import { SITE_BRAND } from "@/lib/site";
import { cn } from "@/lib/utils";

// O catálogo é editado pelo /admin, que manda refazer esta página na hora
// (revalidatePath). O intervalo cobre o PDF enviado direto pelo script.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const materials = await loadPublishedFreeMaterials();
  const totalPages = materials.reduce((sum, m) => sum + m.pages, 0);
  return {
    title: "Apostilas grátis de Claude para advogados | Claude Academy",
    description: `${materials.length} apostilas em PDF do Claude Academy, de graça: configuração, conferência, conectores, skills, projetos e Cowork no escritório. ${totalPages} páginas de material.`,
    keywords: [
      "apostila Claude advogados",
      "material gratuito Claude",
      "Claude para advocacia PDF",
      "skills Claude advogados",
      "Claude Cowork escritório de advocacia",
    ],
  };
}

export default async function MateriaisPage() {
  const materials = await loadPublishedFreeMaterials();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div
          className={cn(
            pageShellClass,
            "flex items-center justify-between gap-3 py-3 sm:gap-6 sm:py-4",
          )}
        >
          <ClaudeAcademyBrand size="sm" className="shrink sm:hidden" />
          <ClaudeAcademyBrand size="md" className="hidden shrink sm:flex" />
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
            <HeaderBuyCta />
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-40"
            aria-hidden
          >
            <div className="absolute -top-32 left-1/2 h-96 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,119,87,0.14)_0%,transparent_70%)] blur-[100px]" />
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Materiais gratuitos
            </p>
            <h1 className="mt-4 font-serif text-[clamp(1.75rem,6vw,3rem)] leading-[1.08] tracking-tight text-balance text-[var(--foreground)]">
              As apostilas do Claude Academy, de graça
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              São {materials.length} apostilas em PDF que acompanham as
              aulas do curso, do primeiro acesso ao Claude até skills, projetos
              e Cowork no escritório. Você deixa seus dados uma vez e baixa
              todas.
            </p>
          </div>
        </section>

        <section className={cn(pageShellClass, "pb-16")}>
          <FreeMaterialsGrid materials={materials} />
          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Conteúdo conferido entre julho e agosto de 2026. Telas, planos e
            nomes de modelo do Claude mudam com frequência.
          </p>
        </section>

        <section className="border-t border-[var(--border)] px-4 py-14 sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
            <h2 className="font-serif text-[clamp(1.5rem,4vw,2.25rem)] leading-tight text-[var(--foreground)]">
              A apostila resume. A aula mostra fazendo.
            </h2>
            <p className="text-base leading-relaxed text-[var(--muted)]">
              No curso você vê cada configuração e cada skill sendo montada na
              tela, e tira dúvida direto na Comunidade VIP.
            </p>
            <Link
              href="/curso"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-8 py-3.5 text-sm font-medium text-[var(--background)] shadow-sm transition hover:bg-[var(--accent-hover)]"
            >
              Conhecer o curso
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-8 sm:px-6">
        <div
          className={cn(
            pageShellClass,
            "flex flex-col items-center justify-between gap-4 text-center text-sm text-[var(--muted)] sm:flex-row sm:text-left",
          )}
        >
          <span>
            © {new Date().getFullYear()} {SITE_BRAND}
          </span>
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
