import Link from "next/link";
import { Suspense } from "react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { LoginForm } from "@/components/login-form";
import { LoginStatusBanner } from "@/components/login-status-banner";
import { OPEN_WHATSAPP_GROUP_URL } from "@/lib/site";

export const metadata = {
  title: "Entrar | Área de membros | Claude para advogados",
  description:
    "Acesse a área de membros do curso de Claude e IA generativa para advogados. Login por link de acesso enviado por e-mail, sem senha.",
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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <ClaudeAcademyBrand size="md" className="mb-10 max-w-full" />
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl tracking-tight text-[var(--foreground)]">
          Área de membros
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Informe o e-mail do seu convite — enviamos um link de acesso, sem senha.
        </p>
        <div className="mt-8">
          <Suspense fallback={null}>
            <LoginStatusBanner />
          </Suspense>
          <Suspense
            fallback={
              <div className="h-40 animate-pulse rounded-xl bg-[var(--border)]/30" />
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-[var(--muted)]">
        <p>Ainda não faz parte?</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <Link
            href="/#precos"
            className="font-medium text-[var(--accent)] underline underline-offset-4 hover:text-[var(--foreground)]"
          >
            Seja membro VIP
          </Link>
          <span aria-hidden>·</span>
          <a
            href={OPEN_WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-[var(--foreground)]"
          >
            <WhatsAppIcon className="size-3.5" />
            Entre na comunidade gratuita
          </a>
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-[var(--foreground)]"
          >
            Voltar à página inicial
          </Link>
        </p>
      </div>
    </div>
  );
}
