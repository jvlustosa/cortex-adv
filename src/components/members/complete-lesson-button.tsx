"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Award, Check, Loader2 } from "lucide-react";
import styles from "./course-area.module.css";

type CompleteLessonButtonProps = {
  isCompleted: boolean;
  hasNext: boolean;
  disabled?: boolean;
  onCompleteAndAdvance: () => Promise<void> | void;
  onGoNext: () => void;
  onUndo: () => Promise<void> | void;
};

export function CompleteLessonButton({
  isCompleted,
  hasNext,
  disabled,
  onCompleteAndAdvance,
  onGoNext,
  onUndo,
}: CompleteLessonButtonProps) {
  const [busy, setBusy] = useState(false);

  if (disabled) {
    return (
      <p className={styles.completeNote}>
        Entre na sua conta para marcar o progresso das aulas.
      </p>
    );
  }

  async function run(action: () => Promise<void> | void) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  if (isCompleted) {
    return (
      <div className={styles.completeRow}>
        <span className={styles.completedPill}>
          <Check className="size-4" strokeWidth={3} aria-hidden />
          Aula concluída
        </span>
        {hasNext ? (
          <button type="button" className={styles.nextBtn} onClick={onGoNext}>
            Próxima aula
            <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <Link href="/certificado" className={styles.nextBtn}>
            <Award className="size-4" aria-hidden />
            Ver certificado
          </Link>
        )}
        <button
          type="button"
          className={styles.undoBtn}
          onClick={() => void run(onUndo)}
          disabled={busy}
        >
          Desfazer
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.completeBtn}
      onClick={() => void run(onCompleteAndAdvance)}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className={`size-4 ${styles.spin}`} aria-hidden />
      ) : (
        <Check className="size-4" strokeWidth={2.5} aria-hidden />
      )}
      {hasNext ? "Marcar como concluída e avançar" : "Marcar como concluída"}
      {hasNext ? <ArrowRight className="size-4" aria-hidden /> : null}
    </button>
  );
}
