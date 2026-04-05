import Link from "next/link";
import { Suspense } from "react";
import { AIOrb } from "@/components/ai-orb";
import { SignupForm } from "@/components/signup-form";

export const metadata = {
  title: "Cadastro — Cortex",
  description:
    "Conta com convite para o mini curso de Claude e IA para advogados.",
  keywords: [
    "cadastro curso Claude advogados",
    "IA para escritório de advocacia",
    "curso IA jurídica",
  ],
  openGraph: {
    images: [{ url: "/og/signup.png", width: 1200, height: 630 }],
  },
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-10 flex items-center gap-3 text-[var(--foreground)]"
      >
        <AIOrb size="sm" />
        <span className="font-serif text-xl tracking-tight">Cortex</span>
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <h1 className="font-serif text-2xl tracking-tight text-[var(--foreground)]">
          Cadastro
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Token, e-mail e senha (mín. 8 caracteres).
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-xl bg-[var(--border)]/30" />
            }
          >
            <SignupForm initialToken={token ?? ""} />
          </Suspense>
        </div>
      </div>
      <p className="mt-8 text-center text-sm text-[var(--muted)]">
        <Link
          href="/"
          className="underline underline-offset-4 hover:text-[var(--foreground)]"
        >
          Voltar à página inicial
        </Link>
      </p>
    </div>
  );
}
