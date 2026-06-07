import styles from "./animated-feature-grid.module.css";

const ICONS_BASE = "/assets/images/animated-icons";

const FEATURES = [
  {
    icon: "crm-kanban.svg",
    title: "CRM",
    description: "Card, etapa e prioridade atualizados pela conversa",
  },
  {
    icon: "follow-up-mensagens.svg",
    title: "Follow-up",
    description: "Mensagens personalizadas sem depender da memória do time",
  },
  {
    icon: "eye-radar.svg",
    title: "Contexto",
    description: "Histórico completo do lead sempre disponível",
  },
  {
    icon: "analise-documentos.svg",
    title: "Documentos",
    description: "Leitura, resumo e checklist do que falta",
  },
  {
    icon: "gestao-equipe.svg",
    title: "Equipe",
    description: "Distribuição e gargalos por responsável",
  },
  {
    icon: "metricas-tempo-real.svg",
    title: "Métricas",
    description: "Dados do CRM viram plano de ação",
  },
] as const;

export function AnimatedFeatureGrid() {
  return (
    <section className={styles.section} aria-labelledby="features-heading">
      <div className={styles.wrap}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>O que você vai dominar</span>
          <h2 id="features-heading" className={styles.title}>
            Claude na prática para advogados
          </h2>
          <p className={styles.subtitle}>
            Currículo construído por quem usa Claude todo dia no escritório.
            Sem teoria solta, só o que funciona.
          </p>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${ICONS_BASE}/${feature.icon}`}
                alt=""
                width={44}
                height={44}
                className={styles.icon}
                aria-hidden
                loading="lazy"
                decoding="async"
              />
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDesc}>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
