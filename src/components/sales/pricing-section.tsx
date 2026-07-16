import { Check, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { COURSE_SCOPE } from "@/data/curso-trilha-public";
import {
  formatBRL,
  getPricingSummary,
  PRICING,
} from "@/lib/pricing";
import { PricingCta } from "./pricing-cta";
import { PricingUrgencyNote } from "./pricing-urgency-note";
import styles from "./pricing-section.module.css";

type Feature = { text: string; icon?: "whatsapp" };

const features: Feature[] = [
  {
    text: `${COURSE_SCOPE.modules} módulos e ${COURSE_SCOPE.lessons} aulas em vídeo — do primeiro prompt à automação, liberadas aos poucos`,
  },
  { text: "Certificado de conclusão verificável online" },
  { text: "Novas aulas e atualizações incluídas, sem pagar de novo" },
  {
    text: "Comunidade exclusiva no WhatsApp por 1 ano — só alunos, networking de alto nível",
    icon: "whatsapp",
  },
  { text: "Acompanhamento de perto com o Dr. Marcos Vilas Boas" },
  {
    text: `Skills premium exclusivas — liberadas após ${PRICING.guaranteeDays} dias da compra`,
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

export function PricingSection() {
  const { total, upfront, savings, upfrontDiscountPercent } =
    getPricingSummary();

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
            Curso completo + Comunidade VIP. Parcela em 12× no cartão ou paga
            à vista e economiza {formatBRL(savings)}.
          </p>
        </header>

        <PricingUrgencyNote />

        <div className={styles.grid}>
          <article className={styles.card}>
            <p className={styles.planLabel}>12× no cartão</p>
            <p className={styles.price}>
              12× {formatBRL(PRICING.installments.amount)}
            </p>
            <p className={styles.priceDetail}>
              {formatBRL(total)} em 12 parcelas iguais
            </p>
            <ul className={styles.features}>
              {features.map((feature) => (
                <FeatureItem key={feature.text} feature={feature} />
              ))}
            </ul>
            <PricingCta
              plan="installments"
              className={`${styles.cta} ${styles.ctaSecondary}`}
              liveLabel="Garantir vaga em 12×"
            />
          </article>

          <article className={`${styles.card} ${styles.cardFeatured}`}>
            <span className={styles.badge}>
              {upfrontDiscountPercent}% mais barato à vista
            </span>
            <p className={styles.planLabel}>Pagamento único</p>
            <p className={styles.price}>{formatBRL(upfront)}</p>
            <p className={styles.priceDetail}>
              Era {formatBRL(total)} parcelado — paga uma vez e pronto
            </p>
            <p className={styles.savings}>
              Você leva {formatBRL(savings)} de desconto
            </p>
            <ul className={styles.features}>
              {features.map((feature) => (
                <FeatureItem key={feature.text} feature={feature} />
              ))}
            </ul>
            <PricingCta
              plan="upfront"
              className={`${styles.cta} ${styles.ctaPrimary}`}
              liveLabel="Garantir vaga à vista"
            />
          </article>
        </div>

        <p className={styles.guarantee}>
          <ShieldCheck className={`size-4 ${styles.guaranteeIcon}`} aria-hidden />
          {PRICING.guaranteeDays} dias pra testar · não gostou, devolvemos 100%
        </p>
      </div>
    </section>
  );
}
