"use client";

import { useState } from "react";
import { ExternalLink, PlayCircle, RotateCcw } from "lucide-react";
import type { VideoSource } from "@/lib/lessons/video-urls";
import styles from "./course-area.module.css";

// `fullscreen` precisa estar aqui: quando existe atributo `allow`, ele tem
// precedência e o `allowFullScreen` sozinho é ignorado pelo Chrome.
const IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";

type LessonPlayerProps = {
  sources: VideoSource[];
  title: string;
};

/**
 * Player da aula com saída de emergência.
 *
 * Iframe cross-origin não avisa quando falha — o `error` nunca dispara e o
 * `load` chega até quando o Tella devolve "bloqueado" ou "not found". Sem sinal
 * confiável, não dá pra trocar de fonte sozinho sem chutar; então as saídas
 * ficam sempre à mão: recarregar o player, trocar de plataforma (quando a aula
 * tem uma segunda) e abrir fora do iframe.
 */
export function LessonPlayer({ sources, title }: LessonPlayerProps) {
  const [index, setIndex] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);

  const source = sources[index];
  const alternate = sources.length > 1 ? sources[(index + 1) % sources.length] : null;

  if (!source) {
    return (
      <div className={styles.playerWrap}>
        <div className={styles.playerPlaceholder}>
          <div className={styles.playerPlaceholderIcon}>
            <PlayCircle className="size-8" strokeWidth={1.5} aria-hidden />
          </div>
          <p className={styles.playerPlaceholderText}>
            Vídeo desta aula em produção. Use o menu ao lado para explorar a
            estrutura do curso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.playerWrap}>
        <iframe
          key={`${source.kind}-${reloadNonce}`}
          className={styles.playerIframe}
          src={source.embedUrl}
          title={title}
          allow={IFRAME_ALLOW}
          allowFullScreen
        />
      </div>

      <div className={styles.playerFallback}>
        <span className={styles.playerFallbackText}>Vídeo travou ou não abriu?</span>

        <button
          type="button"
          className={styles.playerFallbackAction}
          onClick={() => setReloadNonce((n) => n + 1)}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Recarregar player
        </button>

        {alternate ? (
          <button
            type="button"
            className={styles.playerFallbackAction}
            onClick={() => {
              setIndex((i) => (i + 1) % sources.length);
              setReloadNonce((n) => n + 1);
            }}
          >
            <PlayCircle className="size-3.5" aria-hidden />
            Assistir no {alternate.label}
          </button>
        ) : null}

        <a
          className={styles.playerFallbackAction}
          href={source.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Abrir no {source.label}
        </a>
      </div>
    </>
  );
}
