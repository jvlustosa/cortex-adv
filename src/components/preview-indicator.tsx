"use client";

import { X } from "lucide-react";
import type { LaunchPhase } from "@/lib/launch-window";
import { useLaunchState } from "@/lib/use-launch-phase";
import { cn } from "@/lib/utils";
import styles from "./preview-indicator.module.css";

const PHASE_LABEL: Record<LaunchPhase, string> = {
  live: "Vagas abertas · checkout no ar",
  closed: "Inscrições encerradas",
  before: "Antes de abrir",
};

const OPTIONS: { key: LaunchPhase; param: string; label: string }[] = [
  { key: "live", param: "live", label: "Aberto" },
  { key: "closed", param: "closed", label: "Encerrado" },
  { key: "before", param: "before", label: "Antes" },
];

/**
 * Barra fixa que só aparece com `?preview=` ativo. Deixa claro que a página
 * está em modo prévia (não é o estado real) e permite alternar entre as fases
 * ou sair. Some por completo sem o query param.
 */
export function PreviewIndicator() {
  const { phase, isPreview } = useLaunchState();
  if (!isPreview || !phase) return null;

  const path = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <span className={styles.tag}>
        <span className={styles.dot} aria-hidden />
        Prévia ativa
      </span>

      <span className={styles.state}>{PHASE_LABEL[phase]}</span>

      <span className={styles.switch}>
        <span className={styles.switchLabel} aria-hidden>
          ver:
        </span>
        {OPTIONS.map((option) => (
          <a
            key={option.key}
            href={`${path}?preview=${option.param}`}
            className={cn(styles.link, phase === option.key && styles.linkActive)}
            aria-current={phase === option.key ? "true" : undefined}
          >
            {option.label}
          </a>
        ))}
      </span>

      <a href={path} className={styles.exit}>
        <X className="size-3.5" aria-hidden />
        Sair da prévia
      </a>
    </div>
  );
}
