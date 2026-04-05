import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";
import { createClient } from "@/lib/supabase/server";
import { AIOrb } from "@/components/ai-orb";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata = {
  title: "Skills de Claude para advogados — Curso em breve",
  description:
    "Material do mini curso de Claude para advogados: geração de peças, pesquisa jurídica, automação de rotinas, relatórios e gestão de prazos com IA generativa.",
  keywords: [
    "skills Claude advogados",
    "Claude para advocacia",
    "IA generativa peças jurídicas",
    "automação escritório advocacia",
    "curso Claude advogados",
  ],
  openGraph: {
    images: [{ url: "/og/membros.png", width: 1200, height: 630 }],
  },
};

const modules = [
  {
    title: "Cowork com Claude",
    body: "Como tratar o Claude como par na bancada: contexto, iteração e revisão de peças.",
  },
  {
    title: "Automatizar o escritório",
    body: "Modelos, checklists e fluxos para reduzir retrabalho sem abrir mão da supervisão humana.",
  },
  {
    title: "Ética e dados",
    body: "Limites do uso de IA em dados sensíveis e comunicação com clientes.",
  },
];

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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <AIOrb size="sm" />
            <div className="leading-tight">
              <span className="font-serif text-lg tracking-tight">Cortex</span>
              <p className="text-xs text-[var(--muted)]">Membros</p>
            </div>
          </Link>
          {authOn ? <SignOutButton /> : null}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          Mini curso · Claude Cowork para advogados
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-[var(--foreground)] md:text-[2rem]">
          Automatize 100% do seu escritório
        </h1>
        {user?.email ? (
          <p className="mt-4 text-sm text-[var(--muted)]">{user.email}</p>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Autenticação desativada — conteúdo em modo demo.
          </p>
        )}
        <p className="mt-6 text-base leading-relaxed text-[var(--foreground)]/90">
          Abaixo está o esqueleto do material. Substitua por vídeos, PDFs ou links
          hospedados onde preferir.
        </p>
        <ul className="mt-10 space-y-6 border-t border-[var(--border)] pt-10">
          {modules.map((m, i) => (
            <li key={m.title} className="flex gap-4">
              <span className="mt-0.5 font-mono text-sm text-[var(--accent)]">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-medium text-[var(--foreground)]">{m.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  {m.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
