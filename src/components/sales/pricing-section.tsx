import { ArrowRight, Check, ShieldCheck } from "lucide-react";
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

  const message =
    plan === "installments"
      ? "Olá! Quero garantir minha vaga no curso Claude para Advogados no plano 12x de R$ 49."
      : "Olá! Quero garantir minha vaga no curso Claude para Advogados à vista com 40% de desconto.";

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

const features = [
  "Acesso completo aos 3 módulos e todas as aulas",
  "Certificado ao concluir a trilha",
  "Atualizações do conteúdo incluídas",
  "Comunidade VIP de alunos no WhatsApp",
];

export function PricingSection() {
  const { total, upfront, savings } = getPricingSummary();

  return (
    <section className={styles.section} aria-labelledby="pricing-heading">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Investimento</p>
          <h2 id="pricing-heading" className={styles.title}>
            Escolha como prefere pagar
          </h2>
          <p className={styles.subtitle}>
            Parcelado no cartão ou à vista com desconto. Você decide.
          </p>
        </header>

        <div className={styles.grid}>
          <article className={styles.card}>
            <p className={styles.planLabel}>Parcelado</p>
            <p className={styles.price}>
              12× {formatBRL(PRICING.installments.amount)}
            </p>
            <p className={styles.priceDetail}>
              Total de {formatBRL(total)} no cartão
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
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.cta} ${styles.ctaSecondary}`}
            >
              Garantir vaga: 12×
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </a>
          </article>

          <article className={`${styles.card} ${styles.cardFeatured}`}>
            <span className={styles.badge}>
              {PRICING.upfrontDiscountPercent}% off à vista
            </span>
            <p className={styles.planLabel}>À vista</p>
            <p className={styles.price}>{formatBRL(upfront)}</p>
            <p className={styles.priceDetail}>
              De {formatBRL(total)} por {formatBRL(upfront)}
            </p>
            <p className={styles.savings}>
              Economia de {formatBRL(savings)}
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
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.cta} ${styles.ctaPrimary}`}
            >
              Garantir vaga à vista
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </a>
          </article>
        </div>

        <p className={styles.guarantee}>
          <ShieldCheck className={`size-4 ${styles.guaranteeIcon}`} aria-hidden />
          Garantia de {PRICING.guaranteeDays} dias · reembolso integral se não
          servir pra você
        </p>
      </div>
    </section>
  );
}
