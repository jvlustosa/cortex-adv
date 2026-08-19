"use client";

import { useEffect, useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { formatBytes } from "@/lib/admin/format";
import {
  isRenderable,
  materialAspect,
  materialExtension,
  materialKind,
  previewExcerpt,
} from "@/lib/lessons/material-kind";
import type { LessonMaterial } from "@/lib/lessons/materials";
import { cn } from "@/lib/utils";
import styles from "./material-card.module.css";

/** Só o começo do arquivo: a miniatura mostra as primeiras linhas, não o texto todo. */
const EXCERPT_BYTES = 4096;
const TEXTUAL = new Set(["markdown", "html", "text"]);

/**
 * Card de anexo da aula: miniatura na proporção do material (deck 16:9,
 * apostila A4), rótulo e tamanho. Clique abre o visualizador; formato que não
 * renderiza vira download direto.
 */
export function MaterialCard({
  material,
  onOpen,
}: {
  material: LessonMaterial;
  onOpen: (material: LessonMaterial) => void;
}) {
  const kind = materialKind(material.fileName, material.contentType);
  const aspect = materialAspect(material.fileName, kind);
  const ext = materialExtension(material.fileName);
  const renderable = isRenderable(kind);

  const [excerpt, setExcerpt] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!material.url || !TEXTUAL.has(kind)) return;
    let active = true;

    (async () => {
      try {
        // Range pra não baixar a apostila inteira só pra montar a miniatura.
        const res = await fetch(material.url as string, {
          headers: { Range: `bytes=0-${EXCERPT_BYTES - 1}` },
        });
        if (!res.ok) return;
        const raw = (await res.text()).slice(0, EXCERPT_BYTES);
        if (active) setExcerpt(previewExcerpt(raw, kind));
      } catch {
        // Miniatura é enfeite: falhou, o card fica com o ícone.
      }
    })();

    return () => {
      active = false;
    };
  }, [material.url, kind]);

  // Moldura quadrada fixa com a folha centralizada dentro: cada material fica
  // com a forma dele (deck deitado, apostila em pé) e mesmo assim todos os
  // cards da fileira têm a mesma altura — rótulos alinhados.
  const thumb = (
    <span className={styles.thumbArea}>
      {kind === "image" && material.url && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={material.url}
          alt=""
          className={styles.thumbImage}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className={cn(
            styles.sheet,
            aspect === "slide" ? styles.slide : styles.page,
          )}
        >
          {excerpt ? (
            <span className={styles.excerpt}>{excerpt}</span>
          ) : (
            <span className={styles.sheetIcon}>
              <FileText aria-hidden />
              {ext ? <span className={styles.sheetExt}>{ext}</span> : null}
            </span>
          )}
        </span>
      )}
    </span>
  );

  const body = (
    <>
      {thumb}
      <span className={styles.info}>
        <span className={styles.label}>{material.label}</span>
        <span className={styles.sub}>
          {ext ? <span className={styles.ext}>{ext}</span> : null}
          {material.sizeBytes ? <span>{formatBytes(material.sizeBytes)}</span> : null}
          <span className={styles.action}>
            {renderable ? (
              <Eye className={styles.actionIcon} aria-hidden />
            ) : (
              <Download className={styles.actionIcon} aria-hidden />
            )}
          </span>
        </span>
      </span>
    </>
  );

  return (
    <li className={styles.item}>
      {renderable ? (
        <button
          type="button"
          className={styles.card}
          title={material.fileName}
          onClick={() => onOpen(material)}
          disabled={!material.url}
        >
          {body}
        </button>
      ) : (
        <a
          className={styles.card}
          href={material.url ?? "#"}
          title={material.fileName}
          target="_blank"
          rel="noopener noreferrer"
          download={material.fileName}
          aria-disabled={material.url ? undefined : true}
        >
          {body}
        </a>
      )}
    </li>
  );
}
