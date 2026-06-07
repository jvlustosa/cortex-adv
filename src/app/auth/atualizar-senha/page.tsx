import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { PASSWORD_RECOVERY_PAGE } from "@/lib/auth/password-reset";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const metadata = {
  title: "Nova senha | Área de membros",
  robots: { index: false, follow: false },
};

export default async function AtualizarSenhaPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  if (!isSupabaseEnabled()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${PASSWORD_RECOVERY_PAGE}?error=link`);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <ClaudeAcademyBrand size="md" className="mb-10 max-w-full" />
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl tracking-tight text-[var(--foreground)]">
          Nova senha
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Defina uma senha com pelo menos 8 caracteres para continuar no curso.
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-40 animate-pulse rounded-xl bg-[var(--border)]/30" />
            }
          >
            <ResetPasswordForm nextPath={next} />
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
