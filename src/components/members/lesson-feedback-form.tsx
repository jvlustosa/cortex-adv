"use client";

import { useState } from "react";
import { readApiErrorMessage } from "@/lib/errors/format";
import styles from "./lesson-feedback-form.module.css";

type LessonFeedbackFormProps = {
  moduleId: string;
  lessonId: string;
  disabled?: boolean;
};

export function LessonFeedbackForm({
  moduleId,
  lessonId,
  disabled,
}: LessonFeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Escolha uma nota de 1 a 5.");
      return;
    }

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/lessons/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, lessonId, rating, comment }),
      });

      if (!res.ok) {
        setStatus("error");
        setError(await readApiErrorMessage(res, "Não foi possível enviar sua avaliação."));
        return;
      }

      setStatus("done");
    } catch {
      setStatus("error");
      setError("Falha de conexão. Verifique a internet e tente novamente.");
    }
  }

  if (disabled) {
    return (
      <p className={styles.hint}>
        Faça login para avaliar esta aula.
      </p>
    );
  }

  if (status === "done") {
    return (
      <p className={styles.success}>
        Obrigado pelo feedback. Ajuda a melhorar o curso.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={(e) => void submit(e)}>
      <p className={styles.label}>Como foi esta aula?</p>
      <div className={styles.stars} role="group" aria-label="Nota de 1 a 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={styles.starBtn}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Nota ${n}`}
            aria-pressed={rating === n}
          >
            {(hover || rating) >= n ? "★" : "☆"}
          </button>
        ))}
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Comentário (opcional)</span>
        <textarea
          className={styles.textarea}
          value={comment}
          rows={3}
          placeholder="O que ajudou? O que faltou?"
          onChange={(e) => setComment(e.target.value)}
        />
      </label>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button
        type="submit"
        className={styles.submit}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}
