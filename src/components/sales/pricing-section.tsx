"use client";

import { useState } from "react";
import { ArrowRight, Check, Lock, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { COURSE_SCOPE } from "@/data/curso-trilha-public";
import {
  formatBRL,
  getPricingSummary,
  PRICING,
} from "@/lib/pricing";
import { useLaunchPhase } from "@/lib/use-launch-phase";
import { PricingCta } from "./pricing-cta";
import { PricingUrgencyNote } from "./pricing-urgency-note";
import styles from "./pricing-section.module.css";

type Feature = { text: string; icon?: "whatsapp" };

const features: Feature[] = [
  {
    text: `${COURSE_SCOPE.modules} módulos e ${COURSE_SCOPE.lessons} aulas em vídeo: do primeiro prompt à automação, liberadas aos poucos`,
  },
  { text: "Certificado de conclusão verificável online" },
  { text: "Novas aulas e atualizações incluídas, sem pagar de novo" },
  {
    text: "Comunidade exclusiva no WhatsApp por 1 ano, só alunos, networking de alto nível",
    icon: "whatsapp",
  },
  { text: "Acompanhamento de perto com o Dr. Marcos Vilas Boas" },
  {
    text: `Skills premium exclusivas, sendo preparadas (após ${PRICING.guaranteeDays} dias de garantia)`,
  },
];

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <li className={styles.feature}>
      {feature.icon === "whatsapp" ? (
        <WhatsAppIcon
          className={`size-4 ${styles.featureIcon} ${styles.featureIconWa}`}
        />
      ) : (
        <Check className={`size-4 ${styles.featureIcon}`} aria-hidden />
      )}
      <span>{feature.text}</span>
    </li>
  );
}

type Plan = "upfront" | "installments";

export function PricingSection() {
  const phase = useLaunchPhase();
  const { total, upfront, savings, upfrontDiscountPercent } =
    getPricingSummary();
  // À vista abre selecionado: é a condição que a gente quer empurrar.
  const [plan, setPlan] = useState<Plan>("upfront");

  // Os dois planos ficam no ar nos dois modos. O que muda no perpétuo é só a
  // linguagem: nada de "vaga" ou prazo, que não seriam verdade vendendo o ano
  // todo.
  const isEvergreen = phase === "evergreen";

  // Encerrado: some com o preço, mas mantém a pilha de valor à vista (o que
  // entra no curso) e joga todo mundo pra fila de espera. O convite pra
  // comunidade acontece depois, no sucesso do formulário.
  if (phase === "closed") {
    return (
      <section
        id="precos"
        className={styles.section}
        aria-labelledby="pricing-heading"
      >
        <div className={styles.inner}>
          <header className={styles.header}>
            <span className={styles.closedChip}>
              <Lock className="size-5" aria-hidden />
            </span>
            <p className={styles.eyebrow}>Turma encerrada</p>
            <h2 id="pricing-heading" className={styles.title}>
              As vagas dessa turma acabaram
            </h2>
            <p className={styles.subtitle}>
              A próxima turma ainda não tem data marcada. Entre na fila de
              espera e você fica sabendo primeiro, com as condições de
              lançamento antes de todo mundo.
            </p>
          </header>

          <p className={styles.benefitsLabel}>O que está incluído no curso</p>

          <ul className={styles.benefitsGrid}>
            {features.map((feature) => (
              <li key={feature.text} className={styles.benefitCard}>
                {feature.icon === "whatsapp" ? (
                  <WhatsAppIcon
                    className={`size-4 ${styles.featureIcon} ${styles.featureIconWa}`}
                  />
                ) : (
                  <Check
                    className={`size-4 ${styles.featureIcon}`}
                    aria-hidden
                  />
                )}
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>

          <div className={styles.closedCtaWrap}>
            <a href="#lista-espera" className={styles.closedCta}>
              Entrar na fila de espera
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </a>
            <p className={styles.closedNote}>
              Entrar na fila é de graça, sem compromisso. Assim que você entra,
              a gente te chama pra comunidade gratuita no WhatsApp.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="precos"
      className={styles.section}
      aria-labelledby="pricing-heading"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Investimento</p>
          <h2 id="pricing-heading" className={styles.title}>
            Quanto custa o curso
          </h2>
          <p className={styles.subtitle}>
            Curso completo + Comunidade VIP por 1 ano. É o mesmo acesso nas duas
            formas de pagamento: à vista você economiza {formatBRL(savings)}.
          </p>
        </header>

        <PricingUrgencyNote />

        <article
          className={`${styles.card} ${plan === "upfront" ? styles.cardFeatured : ""}`}
        >
          <div className={styles.switch} role="group" aria-label="Forma de pagamento">
            <button
              type="button"
              onClick={() => setPlan("upfront")}
              aria-pressed={plan === "upfront"}
              className={`${styles.switchOption} ${plan === "upfront" ? styles.switchOptionActive : ""}`}
            >
              À vista
              <span className={styles.switchTag}>
                {upfrontDiscountPercent}% off
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPlan("installments")}
              aria-pressed={plan === "installments"}
              className={`${styles.switchOption} ${plan === "installments" ? styles.switchOptionActive : ""}`}
            >
              Parcelado
              <span className={`${styles.switchTag} ${styles.switchTagNeutral}`}>
                12×
              </span>
            </button>
          </div>

          {plan === "upfront" ? (
            <>
              <p className={styles.planLabel}>Pagamento único</p>
              <p className={styles.price}>{formatBRL(upfront)}</p>
              <p className={styles.priceDetail}>
                Era {formatBRL(total)} parcelado. Paga uma vez e pronto
              </p>
              <p className={styles.savings}>
                Você leva {formatBRL(savings)} de desconto
              </p>
            </>
          ) : (
            <>
              <p className={styles.planLabel}>
                {isEvergreen ? "Plano anual no cartão" : "12× no cartão"}
              </p>
              <p className={styles.price}>
                12× {formatBRL(PRICING.installments.amount)}
              </p>
              <p className={styles.priceDetail}>
                {formatBRL(total)} em 12 parcelas iguais
              </p>
              <p className={styles.savingsMuted}>
                À vista sai {formatBRL(upfront)}, {formatBRL(savings)} mais
                barato
              </p>
            </>
          )}

          <p className={styles.sameNote}>
            Muda só a forma de pagar. O que você recebe é exatamente isto nos
            dois casos:
          </p>

          <ul className={styles.features}>
            {features.map((feature) => (
              <FeatureItem key={feature.text} feature={feature} />
            ))}
          </ul>

          {plan === "upfront" ? (
            <PricingCta
              plan="upfront"
              className={`${styles.cta} ${styles.ctaPrimary}`}
              liveLabel={
                isEvergreen ? "Matricular à vista" : "Garantir vaga à vista"
              }
            />
          ) : (
            <PricingCta
              plan="installments"
              className={`${styles.cta} ${styles.ctaPrimary}`}
              liveLabel={
                isEvergreen ? "Fazer minha matrícula" : "Garantir vaga em 12×"
              }
            />
          )}
        </article>

        <p className={styles.guarantee}>
          <ShieldCheck className={`size-4 ${styles.guaranteeIcon}`} aria-hidden />
          {PRICING.guaranteeDays} dias pra testar · não gostou, devolvemos 100%
        </p>
      </div>
    </section>
  );
}
