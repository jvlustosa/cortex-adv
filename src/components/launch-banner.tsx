import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LAUNCH } from "@/lib/pricing";
import styles from "./launch-banner.module.css";

type LaunchBannerProps = {
  ctaHref?: string;
  ctaLabel?: string;
  showCta?: boolean;
};

export function LaunchBanner({
  ctaHref = "#precos",
  ctaLabel = "Garantir vaga",
  showCta = true,
}: LaunchBannerProps) {
  const ctaIsExternal = ctaHref.startsWith("http");

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={styles.inner}>
        <p className={styles.text}>
          <span className={styles.cohort}>{LAUNCH.cohort}</span>
          <span className={styles.message}>
            <strong className={styles.spots}>{LAUNCH.spots} vagas</strong> no
            preço de lançamento
          </span>
        </p>

        {showCta &&
          (ctaIsExternal ? (
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cta}
            >
              {ctaLabel}
              <ArrowRight className="size-3.5" aria-hidden />
            </a>
          ) : (
            <Link href={ctaHref} className={styles.cta}>
              {ctaLabel}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ))}
      </div>
    </div>
  );
}
