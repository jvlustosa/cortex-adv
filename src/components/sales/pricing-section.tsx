import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { COURSE } from "@/data/course-content";
import {
  formatBRL,
  getPricingSummary,
  PRICING,
} from "@/lib/pricing";
import styles from "./pricing-section.module.css";

const checkoutInstallments =
  process.env.NEXT_PUBLIC_CHECKOUT_INSTALLMENTS_URL;
const checkoutUpfront = process.env.NEXT_PUBLIC_CHECKOUT_UPFRONT_URL;

function checkoutHref(plan: "installments" | "upfront") {
  const url =
    plan === "installments" ? checkoutInstallments : checkoutUpfront;
  if (url) return url;

  return "#lista-espera";
}

const features = [
  `Trilha completa em vídeo — ${COURSE.modules.length} módulos, do primeiro prompt à automação`,
  "Certificado digital ao concluir",
  "Novas aulas e atualizações incluídas, sem pagar de novo",
  "Comunidade VIP no WhatsApp: suporte às aulas e networking entre alunos",
  `Skills premium exclusivas — liberadas após ${PRICING.guaranteeDays} dias da compra`,
] as const;

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
                <li key={feature} className={styles.feature}>
                  <Check className={`size-4 ${styles.featureIcon}`} aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={checkoutHref("installments")}
              {...(checkoutInstallments
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`${styles.cta} ${styles.ctaSecondary}`}
            >
              Garantir vaga em 12×
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </a>
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
                <li key={feature} className={styles.feature}>
                  <Check className={`size-4 ${styles.featureIcon}`} aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={checkoutHref("upfront")}
              {...(checkoutUpfront
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`${styles.cta} ${styles.ctaPrimary}`}
            >
              Garantir vaga à vista
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </a>
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
