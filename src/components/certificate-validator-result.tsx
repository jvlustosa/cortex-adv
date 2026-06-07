import Link from "next/link";
import { AlertCircle, CheckCircle2, Home, ShieldCheck } from "lucide-react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import type { CertificateLookupResult } from "@/lib/certificates/types";
import { CertificateValidatorForm } from "./certificate-validator-form";
import styles from "./certificate-validator.module.css";

function formatIssuedAt(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

type CertificateValidatorResultProps = {
  result: CertificateLookupResult;
  searchedCode?: string;
};

export function CertificateValidatorResult({
  result,
  searchedCode,
}: CertificateValidatorResultProps) {
  if (result.status === "unconfigured") {
    return (
      <div className={`${styles.panel} ${styles.panelInvalid} relative overflow-hidden p-6 md:p-8`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-[var(--danger)]" aria-hidden />
          <div>
            <span className={styles.statusInvalid}>Indisponível</span>
            <h2 className="mt-4 font-serif text-xl text-[var(--foreground)]">
              Validação temporariamente indisponível
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              O serviço de verificação não está configurado. Tente novamente em
              alguns minutos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === "invalid") {
    return (
      <div className={`${styles.panel} ${styles.panelInvalid} relative overflow-hidden p-6 md:p-8`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-[var(--danger)]" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className={styles.statusInvalid}>Não encontrado</span>
            <h2 className="mt-4 font-serif text-xl text-[var(--foreground)]">
              Certificado não validado
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Nenhum certificado ativo corresponde ao código{" "}
              <code className="rounded bg-[var(--background)] px-1.5 py-0.5 font-mono text-xs text-[var(--foreground)]">
                {searchedCode || result.code || "-"}
              </code>
              . Confira se digitou corretamente ou se o certificado foi revogado.
            </p>
            <div className="mt-6 max-w-sm">
              <CertificateValidatorForm initialCode={searchedCode || result.code} compact />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { certificate } = result;

  return (
    <div className={`${styles.panel} ${styles.panelValid} relative overflow-hidden p-6 md:p-8`}>
      <div className={styles.holoStrip} aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={styles.statusValid}>
            <CheckCircle2 className="size-3.5" aria-hidden />
            Certificado autêntico
          </span>
          <ClaudeAcademyBrand size="sm" href={null} />
        </div>

        <h2 className="mt-5 font-serif text-2xl tracking-tight text-[var(--foreground)]">
          Verificação confirmada
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Este certificado foi emitido pela Claude Academy · Chat Jurídico e está
          registrado em nossa base.
        </p>

        <div className={styles.detailGrid}>
          <div className="sm:col-span-2">
            <p className={styles.detailLabel}>Titular</p>
            <p className={styles.recipient}>{certificate.recipientName}</p>
          </div>
          <div className="sm:col-span-2">
            <p className={styles.detailLabel}>Formação</p>
            <p className={styles.detailValue}>{certificate.courseTitle}</p>
          </div>
          <div>
            <p className={styles.detailLabel}>Carga horária</p>
            <p className={styles.detailValue}>{certificate.workloadHours} horas</p>
          </div>
          <div>
            <p className={styles.detailLabel}>Emitido em</p>
            <p className={styles.detailValue}>
              {formatIssuedAt(certificate.issuedAt)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className={styles.detailLabel}>Código</p>
            <p className="font-mono text-sm tracking-wide text-[var(--accent)]">
              {certificate.code}
            </p>
          </div>
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-[var(--muted)]">
          <ShieldCheck className="size-3.5 shrink-0 text-[var(--success)]" aria-hidden />
          URL oficial de verificação:{" "}
          <span className="truncate font-mono text-[var(--foreground)]/80">
            {certificate.verifyUrl.replace(/^https?:\/\//, "")}
          </span>
        </p>
      </div>
    </div>
  );
}

export function ValidarPageShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={`${styles.validarPage} flex flex-col`}>
      <div className={styles.glow} aria-hidden />
      <header className="relative border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <ClaudeAcademyBrand size="sm" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            <Home className="size-4" aria-hidden />
            Início
          </Link>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Verificação
          </p>
          <h1 className="mt-3 font-serif text-3xl tracking-tight text-[var(--foreground)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[var(--muted)]">{subtitle}</p>
          )}
        </div>
        <div className="mx-auto mt-10 max-w-lg">{children}</div>
      </main>
    </div>
  );
}
