import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { OpenGroupLink } from "@/components/open-group-link";
import { OpenGroupQr } from "@/components/open-group-qr";
import { COMMUNITY, SITE_HOST } from "@/lib/site";

export const metadata: Metadata = {
  title: "Grupo aberto | Claude Academy",
  description:
    "Grupo aberto e gratuito no WhatsApp da Claude Academy. Diferente da Comunidade VIP, exclusiva de alunos.",
  robots: { index: false, follow: false },
};

export default function GrupoPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          {COMMUNITY.open.badge} · {COMMUNITY.open.name}
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Entre no grupo aberto
        </h1>

        <p className="max-w-sm text-base leading-relaxed text-[var(--muted)]">
          Comunidade gratuita no WhatsApp para advogados curiosos com IA. Não é
          a Comunidade VIP. Aqui não tem acesso às aulas nem suporte do curso.
        </p>

        <OpenGroupQr />

        <OpenGroupLink
          className="flex items-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#25d366" }}
        >
          <WhatsAppIcon className="size-[22px]" />
          Abrir grupo aberto
        </OpenGroupLink>

        <p className="text-sm text-[var(--muted)]">
          Já é aluno? A Comunidade VIP é liberada na matrícula.{" "}
          <Link
            href="/login"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            entrar na área de membros
          </Link>
          .
        </p>

        <Link
          href="/"
          className="mt-2 text-sm transition-colors hover:text-white"
          style={{ color: "#a1a1aa" }}
        >
          &larr; Voltar para {SITE_HOST}
        </Link>
      </div>
    </main>
  );
}
