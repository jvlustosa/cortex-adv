"use client";

import { usePathname } from "next/navigation";
import styles from "./aulas-shell.module.css";

// Fade sutil no conteúdo a cada troca de rota. O `key={pathname}` remonta só
// esta subárvore (o header/footer do layout ficam parados), então a animação
// de entrada roda a cada navegação. Respeita prefers-reduced-motion no CSS.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={styles.pageEnter}>
      {children}
    </div>
  );
}
