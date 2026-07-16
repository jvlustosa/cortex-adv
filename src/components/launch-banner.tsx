"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageShellClass } from "@/lib/layout";
import { LAUNCH } from "@/lib/pricing";
import {
  LAUNCH_CLOSES_AT,
  LAUNCH_CLOSES_LABEL,
  LAUNCH_OPENS_LABEL,
  formatRemaining,
} from "@/lib/launch-window";
import { useLaunchState } from "@/lib/use-launch-phase";
import { cn } from "@/lib/utils";
import styles from "./launch-banner.module.css";

export function LaunchBanner() {
  const { now, phase, isPreview } = useLaunchState();
  const remaining =
    now && phase === "live" ? formatRemaining(now, LAUNCH_CLOSES_AT) : "";

  const spots = <strong className={styles.spots}>{LAUNCH.spots} vagas</strong>;

  let badge: string;
  let message: ReactNode;
  let ctaHref: string;
  let ctaLabel: string;

  switch (phase) {
    case "live":
      badge = "Vagas abertas";
      message = (
        <>
          Preço de lançamento no ar — {spots}, encerra{" "}
          <strong>{LAUNCH_CLOSES_LABEL}</strong>
          {remaining ? ` · faltam ${remaining}` : ""}
        </>
      );
      ctaHref = "#precos";
      ctaLabel = "Garantir vaga";
      break;
    case "closed":
      badge = "Encerrado";
      message = <>Inscrições encerradas — entre na lista de espera</>;
      ctaHref = "#lista-espera";
      ctaLabel = "Lista de espera";
      break;
    case "before":
      badge = LAUNCH.cohort;
      message = (
        <>
          Abre <strong>{LAUNCH_OPENS_LABEL}</strong> — {spots} no preço de
          lançamento
        </>
      );
      ctaHref = "#lista-espera";
      ctaLabel = "Entrar na lista";
      break;
    default:
      // pré-hidratação: mensagem neutra, sem afirmar fase nem revelar checkout
      badge = LAUNCH.cohort;
      message = <>{spots} no preço de lançamento</>;
      ctaHref = "#precos";
      ctaLabel = "Garantir vaga";
  }

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={cn(pageShellClass, styles.inner)}>
        <p className={styles.text}>
          {isPreview && <span className={styles.preview}>Prévia</span>}
          <span className={styles.cohort}>{badge}</span>
          <span className={styles.message}>{message}</span>
        </p>

        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
