import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { COMMUNITY, OPEN_WHATSAPP_GROUP_URL } from "@/lib/site";
import styles from "./community-tiers.module.css";

type CommunityTiersProps = {
  vipCtaHref?: string;
  vipCtaLabel?: string;
};

export function CommunityTiers({
  vipCtaHref = "#lista-espera",
  vipCtaLabel = "Garantir vaga no curso",
}: CommunityTiersProps) {
  const { open, vip } = COMMUNITY;
  const vipIsExternal = vipCtaHref.startsWith("http");

  return (
    <section className={styles.section} aria-labelledby="community-tiers-heading">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Duas comunidades, propósitos diferentes</p>
          <h2 id="community-tiers-heading" className={styles.title}>
            Grupo aberto ou Comunidade VIP?
          </h2>
          <p className={styles.subtitle}>
            O <strong className="text-[var(--foreground)]">grupo aberto</strong> é
            gratuito e serve pra conhecer o movimento. A{" "}
            <strong className="text-[var(--foreground)]">Comunidade VIP</strong>{" "}
            é exclusiva de quem compra o curso completo.
          </p>
        </header>

        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>{open.name}</h3>
              <span className={`${styles.badge} ${styles.badgeOpen}`}>
                {open.badge}
              </span>
            </div>
            <p className={styles.tagline}>{open.tagline}</p>
            <ul className={styles.perks}>
              {open.perks.map((perk) => (
                <li key={perk} className={styles.perk}>
                  <Check className={`${styles.perkIcon} size-3.5`} aria-hidden />
                  {perk}
                </li>
              ))}
            </ul>
            <p className={styles.note}>{open.note}</p>
            <a
              href={OPEN_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.cta} ${styles.ctaOpen}`}
            >
              <WhatsAppIcon className="size-4" />
              Entrar no grupo aberto
            </a>
          </article>

          <article className={`${styles.card} ${styles.cardVip}`}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>{vip.name}</h3>
              <span className={`${styles.badge} ${styles.badgeVip}`}>
                {vip.badge}
              </span>
            </div>
            <p className={styles.tagline}>{vip.tagline}</p>
            <ul className={styles.perks}>
              {vip.perks.map((perk) => (
                <li key={perk} className={styles.perk}>
                  <Lock className={`${styles.perkIcon} size-3.5`} aria-hidden />
                  {perk}
                </li>
              ))}
            </ul>
            <p className={styles.note}>{vip.note}</p>
            {vipIsExternal ? (
              <a
                href={vipCtaHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.cta} ${styles.ctaVip}`}
              >
                {vipCtaLabel}
                <ArrowRight className="size-4 opacity-80" aria-hidden />
              </a>
            ) : (
              <Link href={vipCtaHref} className={`${styles.cta} ${styles.ctaVip}`}>
                {vipCtaLabel}
                <ArrowRight className="size-4 opacity-80" aria-hidden />
              </Link>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
