"use client";

import { Clock } from "lucide-react";
import { LAUNCH_CLOSES_LABEL } from "@/lib/launch-window";
import { useLaunchPhase } from "@/lib/use-launch-phase";
import styles from "./pricing-section.module.css";

/**
 * Escassez real do lançamento: o preço de lançamento tem prazo. Só aparece
 * enquanto a janela está aberta (live) — some assim que encerra, pra nunca
 * afirmar um prazo que já passou. null (pré-hidratação) também fica escondido.
 */
export function PricingUrgencyNote() {
  const phase = useLaunchPhase();
  if (phase !== "live") return null;

  return (
    <p className={styles.urgency} role="status">
      <Clock className={`size-4 ${styles.urgencyIcon}`} aria-hidden />
      <span>
        Preço de lançamento até {LAUNCH_CLOSES_LABEL}. Depois, a Comunidade VIP
        fecha para novas entradas e o valor sobe.
      </span>
    </p>
  );
}
