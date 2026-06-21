import Image from "next/image";
import styles from "./module-cover.module.css";

type ModuleCoverProps = {
  src: string;
  title: string;
  seasonNumber: number;
  variant?: "hero" | "thumb";
  className?: string;
};

export function ModuleCover({
  src,
  title,
  seasonNumber,
  variant = "hero",
  className,
}: ModuleCoverProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={`${styles.cover} ${isHero ? styles.coverHero : styles.coverThumb} ${className ?? ""}`}
      aria-hidden={variant === "thumb" ? true : undefined}
    >
      <Image
        src={src}
        alt=""
        fill
        quality={92}
        sizes={
          isHero
            ? "(max-width: 640px) 72vw, (max-width: 1024px) 280px, 360px"
            : "(max-width: 480px) 120px, 136px"
        }
        className={styles.image}
        priority={isHero && seasonNumber === 0}
      />
      <div className={styles.overlay} aria-hidden />
      <div className={styles.caption}>
        <span className={styles.eyebrow}>
          Módulo {(seasonNumber + 1).toString().padStart(2, "0")}
        </span>
        {isHero ? (
          <h2 className={styles.title}>{title}</h2>
        ) : (
          <p className={styles.title} aria-hidden>
            {title}
          </p>
        )}
        <span className={styles.accent} aria-hidden />
      </div>
    </div>
  );
}
