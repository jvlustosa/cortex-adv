import type { CourseMaterial } from "@/data/materiais";
import { CourseMaterialsBrowser } from "./course-materials-browser";
import styles from "./course-materials-area.module.css";

type CourseMaterialsAreaProps = {
  materials: CourseMaterial[];
};

/**
 * Materiais Didáticos: as apostilas do curso para o aluno, com busca e filtro
 * por categoria. Mesmo card de /materiais em versão compacta, sem o
 * formulário de lead; o download passa pela rota que exige login.
 */
export function CourseMaterialsArea({ materials }: CourseMaterialsAreaProps) {
  return (
    <section className={styles.section} aria-labelledby="materiais-titulo">
      <header className={styles.hero}>
        <p className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden />
          Materiais Didáticos
        </p>
        <h1 id="materiais-titulo" className={styles.title}>
          As apostilas do curso,{" "}
          <span className={styles.titleAccent}>para consultar quando quiser</span>
        </h1>
        <p className={styles.subtitle}>
          {materials.length} apostilas em PDF que acompanham as aulas. Busque
          pelo tema ou filtre pela categoria, e leia a descrição para saber por
          onde começar.
        </p>
      </header>

      <CourseMaterialsBrowser materials={materials} />
    </section>
  );
}
