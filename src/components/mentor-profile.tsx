import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  Code2,
  GraduationCap,
  Landmark,
  Mic2,
} from "lucide-react";
import { TestimonialAudioPlayer } from "@/components/testimonial-audio-player";
import { COURSE_MENTOR } from "@/lib/site";
import styles from "./mentor-profile.module.css";

const TESTIMONIAL_AUDIO = "/assets/audio/depoimento-implantacao-claude.ogg";
const TESTIMONIAL_PHOTO =
  "/assets/images/lp/depoimento-maira-luiza-dos-santos.png";
const TESTIMONIAL_OFFICE_URL = "https://www.facebook.com/mairaadvogada";

const MENTOR_PHOTO = "/assets/images/lp/masterclass-speaker-marcos-vilas-boas.jpg";

const CREDENTIALS = [
  { icon: Briefcase, label: "11 anos de advocacia" },
  { icon: Code2, label: "Programador de software" },
  { icon: GraduationCap, label: "PUC · FGV" },
  { icon: Landmark, label: "Conselheiro do Contribuinte" },
  { icon: Mic2, label: "Masterclass semanal" },
] as const;

export function MentorProfile() {
  return (
    <section className={styles.section} aria-labelledby="mentor-heading">
      <div className={styles.glow} aria-hidden />
      <div className={styles.wrap}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>Prova real</span>
          <h2 id="mentor-heading" className={styles.title}>
            Resultado de quem implantou Claude no escritório
          </h2>
        </div>

        <TestimonialAudioPlayer
          src={TESTIMONIAL_AUDIO}
          title="Depoimento sobre a implantação do Claude no dia a dia"
          subtitle="Áudio espontâneo contando o que mudou na rotina do escritório depois de aplicar o Claude Cowork."
          speaker={{
            name: "Dra. Maira Luíza dos Santos",
            photo: TESTIMONIAL_PHOTO,
            photoAlt: "Dra. Maira Luíza dos Santos, advogada em Cachoeiro de Itapemirim, ES",
            credential: "OAB/ES 21.348 · Cachoeiro de Itapemirim, ES",
            officeName: "Maira Luiza dos Santos Sociedade Individual de Advocacia",
            officeUrl: TESTIMONIAL_OFFICE_URL,
          }}
        />

        <div className={styles.ctaBlock}>
          <p className={styles.ctaText}>
            O que ela implantou no escritório está destrinchado na trilha, aula
            por aula, sem programar.
          </p>
          <a href="#precos" className={styles.ctaPrimary}>
            Ver preços e se matricular
            <ArrowRight className="size-4 opacity-80" aria-hidden />
          </a>
        </div>

        <div className={styles.mentorDivider}>
          <span className={styles.mentorDividerLabel}>Seu mentor</span>
        </div>

        <div className={styles.card}>
          <div className={styles.photoWrap}>
            <Image
              src={MENTOR_PHOTO}
              alt={COURSE_MENTOR.name}
              width={280}
              height={280}
              className={styles.photo}
              priority={false}
            />
            <div className={styles.photoOverlay} aria-hidden />
            <div className={styles.photoGlow} aria-hidden />
          </div>

          <div className={styles.bio}>
            <h3 className={styles.name}>
              {COURSE_MENTOR.nameLines[0]}
              <br />
              {COURSE_MENTOR.nameLines[1]}
            </h3>
            <span className={styles.role}>
              Advogado empresarial, tributarista e programador
            </span>
            <p className={styles.desc}>
              11 anos de advocacia e também programador de software.
              Especialista em Direito Tributário (PUC), Direito Empresarial
              (FGV) e Holdings e Planejamento Sucessório. Usa o Claude e o
              Claude Cowork no dia a dia para automatizar rotinas do
              escritório e ensina os mesmos fluxos no Claude Academy.
            </p>
            <div className={styles.creds}>
              {CREDENTIALS.map(({ icon: Icon, label }) => (
                <span key={label} className={styles.cred}>
                  <Icon className={styles.credIcon} size={14} aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
