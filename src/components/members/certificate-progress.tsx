import Image from "next/image";
import Link from "next/link";
import { Award, Lock, Sparkles } from "lucide-react";
import { CLAUDE_ACADEMY_LOGO } from "@/components/claude-academy-brand";
import {
  CERTIFICATE_COURSE_LINE,
  CERTIFICATE_LABEL,
} from "@/lib/certificates/constants";
import { SITE_NAME } from "@/lib/site";
import type { CourseProgress } from "@/lib/course/progress";
import styles from "./certificate-progress.module.css";

type CertificateProgressProps = {
  progress: CourseProgress;
  userName?: string | null;
};

export function CertificateProgress({
  progress,
  userName,
}: CertificateProgressProps) {
  const remaining = Math.max(progress.totalLessons - progress.viewedLessons, 0);
  const isLocked = !progress.isComplete;

  return (
    <section className={styles.section} aria-labelledby="certificado-progresso">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Certificação</p>
        <h2 id="certificado-progresso" className={styles.title}>
          {isLocked ? "Seu certificado está quase lá" : "Certificado desbloqueado"}
        </h2>
        <p className={styles.subtitle}>
          {isLocked
            ? "Assista todas as aulas do curso para liberar o certificado digital com código de verificação."
            : "Você concluiu o curso. Seu certificado digital com código de verificação já está disponível."}
        </p>
      </header>

      <div className={styles.progressCard}>
        <div className={styles.progressMeta}>
          <span className={styles.progressLabel}>Progresso do curso</span>
          <span className={styles.progressValue}>
            {progress.viewedLessons} de {progress.totalLessons} aulas ·{" "}
            {progress.progressPercent}%
          </span>
        </div>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progress.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso até o certificado"
        >
          <div
            className={styles.progressFill}
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        <p className={styles.progressHint}>
          {isLocked
            ? remaining === 1
              ? "Falta 1 aula para desbloquear."
              : `Faltam ${remaining} aulas para desbloquear.`
            : "Todas as aulas foram assistidas."}
        </p>
      </div>

      <div className={styles.certificateWrap}>
        <div
          className={`${styles.certificatePreview} ${isLocked ? styles.certificatePreviewLocked : ""}`}
          aria-hidden={isLocked}
        >
          <div className={styles.certificateInner}>
            <Image
              src={CLAUDE_ACADEMY_LOGO}
              alt=""
              width={40}
              height={40}
              aria-hidden
            />
            <p className={styles.certTitle}>{SITE_NAME}</p>
            <p className={styles.certSubtitle}>{CERTIFICATE_LABEL}</p>
            <p className={styles.certRecipient}>{userName ?? "Seu nome"}</p>
            <p className={styles.certCourseLine}>{CERTIFICATE_COURSE_LINE}</p>
          </div>
        </div>

        {isLocked ? (
          <div className={styles.lockOverlay}>
            <div className={styles.lockIcon}>
              <Lock className="size-5" aria-hidden />
            </div>
            <p className={styles.lockTitle}>Certificado bloqueado</p>
            <p className={styles.lockText}>
              Complete 100% das aulas para liberar seu certificado.
            </p>
          </div>
        ) : (
          <p className={styles.unlockedBadge}>
            <Sparkles className="size-3.5" aria-hidden />
            Curso concluído
          </p>
        )}
      </div>

      <Link
        href="/certificado"
        className={
          isLocked
            ? "mt-5 inline-flex items-center gap-1.5 text-sm text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
            : "mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]"
        }
      >
        {isLocked ? (
          "Ver prévia do certificado →"
        ) : (
          <>
            <Award className="size-4" aria-hidden />
            Ver e baixar certificado
          </>
        )}
      </Link>

      {!isLocked && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Valide certificados emitidos em{" "}
          <Link
            href="/validar/"
            className="text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
          >
            claudeacademy.chatjuridico.com.br/validar
          </Link>
          .
        </p>
      )}

      {isLocked && progress.progressPercent >= 50 && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Award className="size-3.5 text-[var(--claude)]" aria-hidden />
          Você já passou da metade. Continue assistindo as aulas acima.
        </p>
      )}
    </section>
  );
}
