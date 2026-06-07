import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { CursoCurriculum } from "@/components/curso-curriculum";
import { SignOutButton } from "@/components/sign-out-button";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";
import { CURSO_META } from "@/data/curso-roteiro";

export const metadata = {
  title: "Área de membros — Claude Academy",
  description:
    "Roteiro e material do curso Claude para Advogados: prompting, documentos, Projects, pesquisa jurídica e Skills.",
  keywords: [
    "skills Claude advogados",
    "Claude para advocacia",
    "curso Claude advogados",
    "roteiro curso IA jurídica",
  ],
  openGraph: {
    images: [{ url: "/og/membros.png", width: 1200, height: 630 }],
  },
};

export default async function MembrosPage() {
  const authOn = isSupabaseEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (authOn && !user) {
    redirect("/login?next=/membros");
  }

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="sm" suffix="Membros" showByline={false} />
          </Link>
          {authOn ? <SignOutButton /> : null}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          Claude Academy · {CURSO_META.title}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-[var(--foreground)] md:text-[2rem]">
          Roteiro do curso
        </h1>
        {user?.email ? (
          <p className="mt-4 text-sm text-[var(--muted)]">{user.email}</p>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Autenticação desativada — conteúdo em modo demo.
          </p>
        )}
        <p className="mt-6 text-base leading-relaxed text-[var(--foreground)]/90">
          Roteiro interno completo — não publicado no site. Os vídeos serão liberados
          por nível conforme a turma avançar.
        </p>

        <CursoCurriculum className="mt-10" />
      </main>
    </div>
  );
}
