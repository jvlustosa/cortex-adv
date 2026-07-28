import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { OpenGroupLink } from "@/components/open-group-link";
import { OpenGroupQr } from "@/components/open-group-qr";
import { SITE_HOST } from "@/lib/site";

export const metadata: Metadata = {
  title: "Obrigado | Claude Academy",
  description:
    "Você entrou na lista de espera do Claude Academy. Entre no grupo aberto no WhatsApp enquanto aguarda.",
  robots: { index: false, follow: false },
};

export default function ObrigadoPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Lista de espera
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Obrigado! Você está na fila.
        </h1>

        <p className="max-w-sm text-base leading-relaxed text-[var(--muted)]">
          Avisamos no WhatsApp assim que as inscrições do Claude Academy abrirem.
          Enquanto isso, entre no grupo aberto. É grátis.
        </p>

        <OpenGroupQr />

        <OpenGroupLink
          className="flex items-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#25d366" }}
        >
          <WhatsAppIcon className="size-5" />
          Entrar no grupo aberto
        </OpenGroupLink>

        <p className="text-sm text-[var(--muted)]">
          Sem spam. Avisamos só quando a turma abrir.
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
