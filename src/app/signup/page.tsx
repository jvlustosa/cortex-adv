import Link from "next/link";
import { Suspense } from "react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { SignupForm } from "@/components/signup-form";
import {
  buildInviteGreeting,
  getInviteRecipientByToken,
  type InviteRecipient,
} from "@/lib/invites/recipient";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

export const metadata = {
  title: "Cadastro | Claude Academy",
  description:
    "Conta com convite para o curso completo de Claude e IA para advogados.",
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
  const inviteToken = token?.trim() ?? "";

  // Convite vinculado a uma pessoa: puxa nome/e-mail do banco pra saudar e
  // pré-preencher. Só consulta com Supabase ativo (evita quebra em modo demo).
  let recipient: InviteRecipient | null = null;
  if (inviteToken && isSupabaseEnabled()) {
    recipient = await getInviteRecipientByToken(inviteToken);
  }

  const greeting = buildInviteGreeting(recipient);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <ClaudeAcademyBrand size="md" className="mb-10 max-w-full" />
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl tracking-tight text-[var(--foreground)]">
          {greeting ?? "Cadastro"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {greeting
            ? "Falta só criar sua senha (mín. 8 caracteres) pra entrar."
            : "Token, e-mail e senha (mín. 8 caracteres)."}
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-xl bg-[var(--border)]/30" />
            }
          >
            <SignupForm
              initialToken={inviteToken}
              initialEmail={recipient?.email ?? ""}
            />
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
