"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, MessageCircle, RotateCcw } from "lucide-react";
import {
  defaultCrashDescription,
  defaultCrashTitle,
  formatErrorDetail,
  formatErrorDigest,
} from "@/lib/errors/format";
import {
  buildErrorSupportWhatsAppUrl,
  COURSE_SUPPORT_PHONE_DISPLAY,
} from "@/lib/support";
import styles from "./error-state.module.css";

type ErrorStateProps = {
  error?: unknown;
  title?: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
};

export function ErrorState({
  error,
  title,
  description,
  digest,
  onRetry,
  showHomeLink = true,
}: ErrorStateProps) {
  const detail = formatErrorDetail(error);
  const errorDigest = digest ?? formatErrorDigest(error);
  const supportUrl = buildErrorSupportWhatsAppUrl(detail, errorDigest);

  useEffect(() => {
    if (error !== undefined) {
      console.error("[Claude Academy] erro de página:", error);
    }
  }, [error]);

  return (
    <div className={styles.shell} role="alert" aria-live="assertive">
      <div className={styles.card}>
        <div className={styles.grid}>
          <div className={styles.iconWrap}>
            <div className={styles.iconBadge} aria-hidden>
              <AlertTriangle className="size-9" strokeWidth={1.75} />
            </div>
          </div>

          <div className={styles.content}>
            <p className={styles.eyebrow}>Erro na página</p>
            <h1 className={styles.title}>{title ?? defaultCrashTitle()}</h1>
            <p className={styles.description}>
              {description ?? defaultCrashDescription()}
            </p>
          </div>

          <div className={styles.details}>
            <p className={styles.detailsLabel}>Detalhe técnico</p>
            <pre className={styles.detailsBox}>
              {detail}
              {errorDigest ? `\n\nRef: ${errorDigest}` : ""}
            </pre>
          </div>

          <div className={styles.actions}>
            {onRetry ? (
              <button type="button" className={styles.primaryBtn} onClick={onRetry}>
                <RotateCcw className="size-4" aria-hidden />
                Tentar de novo
              </button>
            ) : null}
            {showHomeLink ? (
              <Link href="/" className={styles.secondaryBtn}>
                <Home className="size-4" aria-hidden />
                Voltar ao início
              </Link>
            ) : null}
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.supportBtn}
            >
              <MessageCircle className="size-4" aria-hidden />
              Falar com suporte
            </a>
          </div>

          <p className={styles.supportHint}>
            Suporte no WhatsApp:{" "}
            <strong>{COURSE_SUPPORT_PHONE_DISPLAY}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
