"use client";

import { ArrowRight } from "lucide-react";
import { CHECKOUT } from "@/lib/pricing";
import { useLaunchPhase } from "@/lib/use-launch-phase";

type Plan = "installments" | "upfront";

type PricingCtaProps = {
  plan: Plan;
  className: string;
  liveLabel: string;
};

/**
 * CTA de compra com gate de lançamento (cliente). Na janela ao vivo aponta
 * pro checkout ASAAS; antes de abrir ou depois de encerrar, cai na lista de
 * espera. null (pré-hidratação) trata como fechado — nunca revela o checkout
 * antes da hora.
 */
export function PricingCta({ plan, className, liveLabel }: PricingCtaProps) {
  const phase = useLaunchPhase();
  const checkoutUrl = CHECKOUT[plan];
  const open = phase === "live" && Boolean(checkoutUrl);

  const href = open ? checkoutUrl : "#lista-espera";
  const label = open ? liveLabel : "Entrar na lista de espera";

  return (
    <a
      href={href}
      {...(open ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={className}
    >
      {label}
      <ArrowRight className="size-4 opacity-80" aria-hidden />
    </a>
  );
}
