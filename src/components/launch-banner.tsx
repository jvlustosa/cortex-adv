"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageShellClass } from "@/lib/layout";
import { LAUNCH } from "@/lib/pricing";
import {
  LAUNCH_CLOSES_AT,
  LAUNCH_CLOSES_LABEL,
  LAUNCH_OPENS_AT,
  LAUNCH_OPENS_LABEL,
  formatRemaining,
} from "@/lib/launch-window";
import { useLaunchState } from "@/lib/use-launch-phase";
import { PreviewIndicator } from "./preview-indicator";
import { cn } from "@/lib/utils";
import styles from "./launch-banner.module.css";

export function LaunchBanner() {
  const { now, phase } = useLaunchState();

  // Pré-hidratação (phase null): nada no topo. Renderizar uma faixa neutra aqui
  // fazia o banner piscar — aparecia no HTML estático e sumia (ou trocava de
  // texto) assim que o relógio resolvia a fase no cliente.
  // Perpétuo: sem faixa de turma — não existe vaga contada nem prazo pra afirmar.
  // Encerrado: some por completo, sem faixa "encerrado" grudada no topo depois
  // da hora. A captação de lead segue na seção #lista-espera, mais abaixo.
  // (PreviewIndicator segue pra alternar fases no ?preview.)
  if (phase === null || phase === "evergreen" || phase === "closed") {
    return <PreviewIndicator />;
  }

  const remaining =
    now && phase === "live" ? formatRemaining(now, LAUNCH_CLOSES_AT) : "";
  const opensIn =
    now && phase === "before" ? formatRemaining(now, LAUNCH_OPENS_AT) : "";

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
          Preço de lançamento no ar. {spots}, encerra{" "}
          <strong>{LAUNCH_CLOSES_LABEL}</strong>
          {remaining ? ` · faltam ${remaining}` : ""}
        </>
      );
      ctaHref = "#precos";
      ctaLabel = "Garantir vaga";
      break;
    case "before":
      badge = "É hoje";
      message = (
        <>
          Abre {opensIn ? <>em <strong>{opensIn}</strong> · </> : ""}
          <strong>{LAUNCH_OPENS_LABEL}</strong>, {spots} no preço de
          lançamento
        </>
      );
      ctaHref = "#lista-espera";
      ctaLabel = "Entrar na lista";
      break;
  }

  return (
    <>
      <div className={styles.banner} role="status" aria-live="polite">
        <div className={cn(pageShellClass, styles.inner)}>
          <p className={styles.text}>
            <span className={styles.cohort}>{badge}</span>
            <span className={styles.message}>{message}</span>
          </p>

          <Link href={ctaHref} className={styles.cta}>
            {ctaLabel}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <PreviewIndicator />
    </>
  );
}
