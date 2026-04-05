import Link from "next/link";
import { AIOrb } from "@/components/ai-orb";
import { MessageCircle, ArrowRight, KeyRound } from "lucide-react";

const whatsappUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ??
  "https://chat.whatsapp.com/SEU_LINK_DO_GRUPO";

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-md">
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
              href="/signup"
              className="hidden rounded-lg px-3 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline"
            >
              Cadastro
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-40"
            aria-hidden
          >
            <div className="absolute -top-32 left-1/2 h-96 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--accent)]/15 to-transparent blur-3xl" />
          </div>
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
                Primeiro mini curso · Claude Cowork
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-[1.08] tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[3.35rem]">
                Claude Cowork para advogados
              </h1>
              <p className="mt-5 max-w-xl text-xl font-medium leading-snug text-[var(--foreground)]/95 md:text-2xl">
                Automatize 100% do seu escritório
              </p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
                Use Claude como copiloto na bancada: peças, rotinas e comunicação
                com padrão de escritório — com grupo no WhatsApp para troca e
                convite para a área de membros com o material do curso.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--accent-hover)]"
                >
                  <KeyRound className="size-5" aria-hidden />
                  Entrar com convite
                  <ArrowRight className="size-4 opacity-80" aria-hidden />
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/35"
                >
                  <MessageCircle className="size-5 text-[var(--muted)]" aria-hidden />
                  Grupo no WhatsApp
                </a>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative flex flex-col items-center rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 shadow-sm">
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

        <section className="border-t border-[var(--border)] bg-[var(--surface)]/50 px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
            {[
              {
                title: "Cowork com IA",
                body: "Claude ao lado do advogado: contexto, revisão e entrega.",
              },
              {
                title: "Automação real",
                body: "Modelos e rotinas para ganhar tempo sem perder o controle.",
              },
              {
                title: "Membros + convite",
                body: "Cadastro só com token; material na área logada.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6"
              >
                <h2 className="font-serif text-lg text-[var(--foreground)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center text-sm text-[var(--muted)] sm:flex-row sm:text-left">
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
      </footer>
    </div>
  );
}
