import Link from "next/link";
import { Suspense } from "react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { RecoveryStatusBanner } from "@/components/recovery-status-banner";

export const metadata = {
  title: "Recuperar senha | Área de membros",
  description: "Solicite um link para redefinir a senha da sua conta na Claude Academy.",
  robots: { index: false, follow: false },
};

export default function RecuperarSenhaPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <ClaudeAcademyBrand size="md" className="mb-10 max-w-full" />
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl tracking-tight text-[var(--foreground)]">
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Informe o e-mail do convite. Enviaremos um link para você criar uma nova senha.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <RecoveryStatusBanner />
          </Suspense>
        </div>
        <div className="mt-6">
          <Suspense
            fallback={
              <div className="h-32 animate-pulse rounded-xl bg-[var(--border)]/30" />
            }
          >
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
      <p className="mt-8 text-center text-sm text-[var(--muted)]">
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-[var(--foreground)]"
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
