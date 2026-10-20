import { Download, ExternalLink } from "lucide-react";
import { CopyPrompt } from "@/components/members/copy-prompt";
import {
  DEGRAVACAO_AUTHOR,
  DEGRAVACAO_INSTALL_STEPS,
  DEGRAVACAO_MARKETPLACE_COMMANDS,
  DEGRAVACAO_PROMPTS,
  DEGRAVACAO_REQUIREMENTS,
} from "@/data/degravacao";
import { requireProductAccess } from "@/lib/course/require-access";
import {
  DEGRAVACAO_REPO,
  fetchDegravacaoReleases,
} from "@/lib/degravacao/releases";

export const metadata = {
  title: "Degravação com Claude | Claude Academy",
  description:
    "Plugin, passo a passo de instalação e versões novas do Degravação com Claude.",
  robots: { index: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatSize(bytes: number): string | null {
  if (!bytes) return null;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const cardClass =
  "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8";

export default async function DegravacaoMembrosPage() {
  await requireProductAccess("degravacao", "/area-de-membros/degravacao");
  const releases = await fetchDegravacaoReleases();
  const latest = releases[0] ?? null;
  const releasesPage = `https://github.com/${DEGRAVACAO_REPO}/releases`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
          Plugin
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-[var(--foreground)]">
          Degravação com Claude
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Vídeo ou áudio vira degravação integral com minutagem, num documento
          estruturado e num player com o texto sincronizado. Desenvolvido por{" "}
          <a
            href={DEGRAVACAO_AUTHOR.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-[var(--foreground)]"
          >
            {DEGRAVACAO_AUTHOR.name}
          </a>
          .
        </p>
      </header>

      <section className={cardClass} aria-labelledby="versao-atual">
        <h2
          id="versao-atual"
          className="font-serif text-xl tracking-tight text-[var(--foreground)]"
        >
          {latest ? `Versão atual: ${latest.name}` : "Versão atual"}
        </h2>
        {latest?.plugin ? (
          <>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Publicada em {formatDate(latest.publishedAt)}
              {formatSize(latest.plugin.sizeBytes)
                ? ` · ${formatSize(latest.plugin.sizeBytes)}`
                : ""}
            </p>
            <a
              href={latest.plugin.url}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
            >
              <Download className="size-4" aria-hidden />
              Baixar {latest.plugin.fileName}
            </a>
          </>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Não conseguimos carregar a versão agora. Baixe o arquivo .plugin
            direto na{" "}
            <a
              href={releasesPage}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              página de versões
            </a>{" "}
            ou use os comandos do marketplace abaixo.
          </p>
        )}
      </section>

      <section className={cardClass} aria-labelledby="instalar">
        <h2
          id="instalar"
          className="font-serif text-xl tracking-tight text-[var(--foreground)]"
        >
          Como instalar
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-[var(--foreground)]">
          {DEGRAVACAO_INSTALL_STEPS.map((step) => (
            <li key={step} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>

        <h3 className="mt-8 text-sm font-medium text-[var(--foreground)]">
          Tem Git? Instale pelo marketplace e receba as versões novas pelo
          próprio Claude Code
        </h3>
        <ul className="mt-3 space-y-2">
          {DEGRAVACAO_MARKETPLACE_COMMANDS.map((command) => (
            <li
              key={command}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2"
            >
              <code className="break-all text-sm">{command}</code>
              <CopyPrompt text={command} label="Copiar comando" />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Para atualizar depois: no Claude Code, /plugin › Marketplaces ›
          atualizar. Quem instalou pelo arquivo baixa a versão nova aqui e envia
          de novo.
        </p>

        <h3 className="mt-8 text-sm font-medium text-[var(--foreground)]">
          O que precisa
        </h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
          {DEGRAVACAO_REQUIREMENTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={cardClass} aria-labelledby="no-dia-a-dia">
        <h2
          id="no-dia-a-dia"
          className="font-serif text-xl tracking-tight text-[var(--foreground)]"
        >
          No dia a dia, é só pedir
        </h2>
        <ul className="mt-4 space-y-2">
          {DEGRAVACAO_PROMPTS.map((prompt) => (
            <li
              key={prompt}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
            >
              <span>{prompt}</span>
              <CopyPrompt text={prompt} />
            </li>
          ))}
        </ul>
      </section>

      <section className={cardClass} aria-labelledby="versoes">
        <h2
          id="versoes"
          className="font-serif text-xl tracking-tight text-[var(--foreground)]"
        >
          O que mudou em cada versão
        </h2>
        {releases.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {releases.map((release) => (
              <li key={release.tag}>
                <details className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">
                    {release.name} · {formatDate(release.publishedAt)}
                  </summary>
                  {release.notes ? (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">
                      {release.notes}
                    </p>
                  ) : null}
                  {release.plugin ? (
                    <a
                      href={release.plugin.url}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--accent)] underline underline-offset-4"
                    >
                      <Download className="size-3.5" aria-hidden />
                      {release.plugin.fileName}
                    </a>
                  ) : null}
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            O histórico está na{" "}
            <a
              href={releasesPage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              página de versões
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
            .
          </p>
        )}
      </section>
    </main>
  );
}
