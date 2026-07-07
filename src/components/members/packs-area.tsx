import Link from "next/link";
import { ArrowRight, Lock, Plug, Sparkles } from "lucide-react";
import type { Pack, PackIconKey } from "@/data/packs";
import type { PackAccess } from "@/lib/course/packs-access";
import { formatUnlockDate } from "@/lib/course/packs-access";
import { PRICING } from "@/lib/pricing";
import { ConnectorUrl } from "./connector-url";
import styles from "./packs-area.module.css";

type PacksAreaProps = {
  packs: Pack[];
  access: PackAccess;
};

const PACK_ICONS: Record<PackIconKey, typeof Sparkles> = {
  skills: Sparkles,
  conectores: Plug,
};

export function PacksArea({ packs, access }: PacksAreaProps) {
  const unlockDate = formatUnlockDate(access.unlockAt);

  return (
    <section className={styles.section} aria-labelledby="packs-titulo">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Inclusos no curso</p>
        <h1 id="packs-titulo" className={styles.title}>
          Seus packs
        </h1>
        <p className={styles.subtitle}>
          Skills e conectores prontos para instalar no seu Claude. Liberados
          após os {PRICING.guaranteeDays} dias de garantia.
        </p>
      </header>

      {!access.isUnlocked ? (
        <div className={styles.lockBanner} role="status">
          <span className={styles.lockBannerIcon}>
            <Lock className="size-4" aria-hidden />
          </span>
          <p className={styles.lockBannerText}>
            {unlockDate
              ? `Os packs liberam em ${unlockDate}, após os ${PRICING.guaranteeDays} dias de garantia.`
              : `Os packs liberam após os ${PRICING.guaranteeDays} dias de garantia.`}
          </p>
        </div>
      ) : null}

      <div className={styles.grid}>
        {packs.map((pack) => {
          const Icon = PACK_ICONS[pack.icon];
          return (
            <article key={pack.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className={styles.cardHeadText}>
                  <h2 className={styles.cardTitle}>{pack.title}</h2>
                  <p className={styles.cardTagline}>{pack.tagline}</p>
                </div>
              </div>

              <ul className={styles.itemList}>
                {pack.items.map((item) => (
                  <li key={item.name} className={styles.item}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemDesc}>{item.description}</p>

                    {item.kind === "remote-connector" ? (
                      access.isUnlocked ? (
                        <div className={styles.connector}>
                          <ConnectorUrl url={item.connectorUrl} />
                          <ol className={styles.steps}>
                            {item.setupSteps.map((step, i) => (
                              <li key={i} className={styles.step}>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <div className={styles.connectorLocked} aria-hidden>
                          <code className={styles.urlCodeBlurred}>
                            {item.connectorUrl}
                          </code>
                        </div>
                      )
                    ) : null}
                  </li>
                ))}
              </ul>

              {pack.id === "skills" ? (
                <Link href="/area-de-membros" className={styles.skillsCta}>
                  Ver skills nos materiais das aulas
                  <ArrowRight className="size-4 opacity-80" aria-hidden />
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
