import Link from "next/link";
import { Suspense } from "react";
import { AIOrb } from "@/components/ai-orb";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Entrar — Área de membros | Claude para advogados",
  description:
    "Acesse a área de membros do curso de Claude e IA generativa para advogados. Login seguro com e-mail e senha.",
  keywords: [
    "login Claude advogados",
    "área de membros IA jurídica",
    "curso Claude para advogados",
  ],
  openGraph: {
    images: [{ url: "/og/login.png", width: 1200, height: 630 }],
  },
};

export default function LoginPage() {
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
          Área de membros
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Entre com o e-mail e a senha cadastrados no convite.
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-40 animate-pulse rounded-xl bg-[var(--border)]/30" />
            }
          >
            <LoginForm />
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
