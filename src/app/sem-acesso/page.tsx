import Link from "next/link";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { SignOutButton } from "@/components/sign-out-button";
import { buildCourseSupportWhatsAppUrl } from "@/lib/support";

export const metadata = {
  title: "Sem acesso | Claude Academy",
  robots: { index: false },
};

// Conta logada sem nenhum produto comprado. Não redireciona para /login: o
// login manda quem está logado de volta à área de membros, e isso viraria loop.
export default function SemAcessoPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <ClaudeAcademyBrand
        size="lg"
        href={null}
        className="flex-col items-center [&_div]:items-center"
      />
      <h1 className="mt-8 font-serif text-3xl tracking-tight text-[var(--foreground)]">
        Sua conta ainda não tem acesso
      </h1>
      <p className="mt-3 max-w-md text-[var(--muted)]">
        Não achamos nenhuma compra ligada a este e-mail. Se você já pagou, fale
        com a gente que liberamos na hora.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={buildCourseSupportWhatsAppUrl()}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
        >
          Falar com o suporte
        </Link>
        <SignOutButton className="rounded-full border border-[var(--border)] px-6 py-3 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]" />
      </div>
    </div>
  );
}
