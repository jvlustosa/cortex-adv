import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { LoginForm } from "@/components/login-form";
import { LoginStatusBanner } from "@/components/login-status-banner";
import { OpenGroupLink } from "@/components/open-group-link";
import { createClient } from "@/lib/supabase/server";

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

export default async function LoginPage() {
  // Sessão já ativa: quem já entrou vai direto pra área de membros em vez de
  // ver o formulário — o login persiste em cookie, então clicar "Entrar" logado
  // não deve reabrir a tela de login.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/area-de-membros");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <ClaudeAcademyBrand size="md" className="mb-10 max-w-full" />
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl tracking-tight text-[var(--foreground)]">
          Área de membros
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sem senha: informe o e-mail do seu convite e enviamos um link de
          acesso. É o único jeito de entrar.
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
          <OpenGroupLink className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-[var(--foreground)]">
            <WhatsAppIcon className="size-3.5" />
            Entre na comunidade gratuita
          </OpenGroupLink>
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
