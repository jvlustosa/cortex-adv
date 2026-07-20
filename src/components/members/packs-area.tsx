import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Gift,
  Lock,
  Plug,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { countPackItems, type Pack, type PackIconKey } from "@/data/packs";
import type { PackAccess } from "@/lib/course/packs-access";
import { formatUnlockDate } from "@/lib/course/packs-access";
import { PRICING } from "@/lib/pricing";
import { ConnectorUrl } from "./connector-url";
import styles from "./packs-area.module.css";

type PacksAreaProps = {
  packs: Pack[];
  access: PackAccess;
};

const PACK_ICONS: Record<PackIconKey, LucideIcon> = {
  skills: Sparkles,
  conectores: Plug,
};

function isTeaser(status: Pack["items"][number]["status"]): boolean {
  return status === "teaser";
}

export function PacksArea({ packs, access }: PacksAreaProps) {
  const unlockDate = formatUnlockDate(access.unlockAt);
  const { total, ready, teasers } = countPackItems(packs);
  const skillsPack = packs.find((p) => p.id === "skills");
  const connectorPack = packs.find((p) => p.id === "conectores");

  return (
    <section className={styles.section} aria-labelledby="packs-titulo">
      <header className={styles.hero}>
        <p className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden />
          Galeria Premium
        </p>
        <h1 id="packs-titulo" className={styles.title}>
          Skills, conectores e mais —{" "}
          <span className={styles.titleAccent}>exclusivo de alunos</span>
        </h1>
        <p className={styles.subtitle}>
          Tudo que o curso libera pro Claude do escritório, num só lugar.{" "}
          {ready} disponíveis
          {teasers > 0 ? ` · ${teasers} sendo preparados` : null}. Liberados após
          os {PRICING.guaranteeDays} dias de garantia.
        </p>
      </header>

      {!access.isUnlocked ? (
        <div className={styles.lockBanner} role="status">
          <span className={styles.lockBannerIcon}>
            <Lock className="size-4" aria-hidden />
          </span>
          <p className={styles.lockBannerText}>
            {unlockDate
              ? `A galeria libera em ${unlockDate}, após os ${PRICING.guaranteeDays} dias de garantia. Enquanto isso, veja o teaser do que está incluso.`
              : `A galeria libera após os ${PRICING.guaranteeDays} dias de garantia. Enquanto isso, veja o teaser do que está incluso.`}
          </p>
        </div>
      ) : null}

      {/* Pack completo — hero box estilo CJ */}
      <article className={`${styles.box} ${styles.boxHero}`}>
        <span className={`${styles.boxIcon} ${styles.boxIconLg}`} aria-hidden>
          <Gift className="size-8" />
        </span>
        <div className={styles.boxBody}>
          <h2 className={styles.boxTitle}>Pack Completo Academy</h2>
          <span className={styles.boxMeta}>{total} itens na galeria</span>
          <p className={styles.boxDesc}>
            Skills + conectores do curso. O que já está pronto libera na data; o
            resto aparece aqui assim que for preparado — sem pagar de novo.
          </p>
          <div className={styles.boxTags}>
            {[...new Set(packs.flatMap((p) => p.tags))].map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <span className={styles.boxAction} aria-hidden>
          {access.isUnlocked ? (
            <Sparkles className="size-5" />
          ) : (
            <Lock className="size-5" />
          )}
        </span>
      </article>

      {skillsPack ? (
        <GalleryGroup
          pack={skillsPack}
          unlocked={access.isUnlocked}
          cta={
            <Link href="/area-de-membros" className={styles.skillsCta}>
              Ver skills nos materiais das aulas
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </Link>
          }
        />
      ) : null}

      {connectorPack ? (
        <GalleryGroup pack={connectorPack} unlocked={access.isUnlocked} />
      ) : null}
    </section>
  );
}

function GalleryGroup({
  pack,
  unlocked,
  cta,
}: {
  pack: Pack;
  unlocked: boolean;
  cta?: ReactNode;
}) {
  const Icon = PACK_ICONS[pack.icon];
  const readyCount = pack.items.filter((i) => !isTeaser(i.status)).length;
  const teaserCount = pack.items.length - readyCount;

  return (
    <div className={styles.group}>
      <div className={styles.groupHead}>
        <h2 className={styles.groupTitle}>{pack.title}</h2>
        <p className={styles.groupSub}>
          {pack.tagline}{" "}
          <span className={styles.groupCount}>
            {readyCount} prontos
            {teaserCount > 0 ? ` · ${teaserCount} em preparação` : null}
          </span>
        </p>
      </div>

      <div className={styles.grid}>
        {pack.items.map((item) => {
          const teaser = isTeaser(item.status);
          const showDetail = unlocked && !teaser;

          return (
            <article
              key={item.name}
              className={`${styles.box} ${teaser || !unlocked ? styles.boxTeaser : ""}`}
            >
              <span className={styles.boxIcon} aria-hidden>
                <Icon className="size-5" />
              </span>
              <div className={styles.boxBody}>
                <div className={styles.boxTitleRow}>
                  <h3 className={styles.boxTitle}>{item.name}</h3>
                  {teaser ? (
                    <span className={styles.teaserBadge}>Sendo preparado</span>
                  ) : !unlocked ? (
                    <span className={styles.teaserBadge}>Teaser</span>
                  ) : null}
                </div>
                <p
                  className={
                    !unlocked || teaser
                      ? `${styles.boxDesc} ${styles.boxDescBlur}`
                      : styles.boxDesc
                  }
                >
                  {item.description}
                </p>

                {item.kind === "remote-connector" ? (
                  showDetail ? (
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
              </div>
              <span className={styles.boxAction} aria-hidden>
                {teaser || !unlocked ? (
                  <Lock className="size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
              </span>
            </article>
          );
        })}
      </div>

      {cta && unlocked ? cta : null}
    </div>
  );
}
