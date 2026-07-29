import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { VIP_WHATSAPP_GROUP_URL } from "@/lib/site";
import styles from "./vip-group-step.module.css";

export function VipGroupStep() {
  return (
    <section className={styles.card} aria-labelledby="vip-group-step-title">
      <p className={styles.eyebrow}>Passo 1 · Comunidade VIP</p>
      <h2 id="vip-group-step-title" className={styles.title}>
        Entre no grupo Exclusivo de alunos
      </h2>
      <p className={styles.text}>
        Aqui a gente responde suas dúvidas das aulas e você troca com quem já
        usa o Claude no dia a dia do escritório. Comece por aqui.
      </p>
      <a
        className={styles.cta}
        href={VIP_WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <WhatsAppIcon />
        Entrar no grupo Exclusivo
      </a>
      <p className={styles.note}>
        Você será aprovado assim que os administradores verificarem seu número.
      </p>
    </section>
  );
}
