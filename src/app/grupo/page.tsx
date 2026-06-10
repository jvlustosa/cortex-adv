import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COMMUNITY, OPEN_WHATSAPP_GROUP_URL, SITE_HOST } from "@/lib/site";

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

        <div className="hidden md:block">
          <div
            className="overflow-hidden rounded-2xl bg-white p-5"
            style={{
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            <Image
              src="/assets/images/qr-grupo-whatsapp.png"
              alt="QR Code do grupo aberto Claude Academy no WhatsApp"
              width={320}
              height={320}
              className="size-80 rounded-lg"
              priority
            />
          </div>
          <p className="mt-3 text-xs" style={{ color: "#71717a" }}>
            Aponte a câmera do celular para entrar
          </p>
        </div>

        <a
          href={OPEN_WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#25d366" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Abrir grupo aberto
        </a>

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
