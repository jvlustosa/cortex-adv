"use client";

import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import { Download, ExternalLink, FileWarning, Loader2, X } from "lucide-react";
import {
  isHtmlFragment,
  materialKind,
  type MaterialKind,
} from "@/lib/lessons/material-kind";
import type { LessonMaterial } from "@/lib/lessons/materials";
import styles from "./material-viewer.module.css";

// Estilo do documento renderizado dentro do iframe (isolado do app). Paleta
// escura alinhada à área de membros; sem depender das CSS vars do pai.
const DOC_CSS = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.75rem 2rem 2.5rem;
    font-family: "DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: #ece9e4;
    background: #14120f;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4 { color: #fff; line-height: 1.25; margin: 1.6em 0 0.6em; font-weight: 650; }
  h1 { font-size: 1.7rem; } h2 { font-size: 1.35rem; } h3 { font-size: 1.12rem; }
  h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }
  p { margin: 0 0 0.9em; }
  a { color: #e08a63; text-decoration: underline; text-underline-offset: 2px; }
  strong { color: #fff; }
  ul, ol { margin: 0 0 0.9em; padding-left: 1.4em; }
  li { margin: 0.25em 0; }
  code {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.86em;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px;
    padding: 0.12em 0.4em;
  }
  pre {
    background: #0c0b09;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 0.7rem;
    padding: 1rem 1.1rem;
    overflow-x: auto;
    margin: 0 0 1.1em;
  }
  pre code { background: none; border: 0; padding: 0; font-size: 0.85rem; }
  blockquote {
    margin: 0 0 1em;
    padding: 0.2em 0 0.2em 1.1em;
    border-left: 3px solid rgba(217,119,87,0.55);
    color: #c9c4bc;
  }
  table { border-collapse: collapse; width: 100%; margin: 0 0 1.1em; font-size: 0.92em; }
  th, td { border: 1px solid rgba(255,255,255,0.12); padding: 0.5em 0.7em; text-align: left; }
  th { background: rgba(255,255,255,0.05); color: #fff; }
  img { max-width: 100%; height: auto; border-radius: 0.5rem; }
  hr { border: 0; border-top: 1px solid rgba(255,255,255,0.12); margin: 1.6em 0; }
`;

function wrapDoc(bodyHtml: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank"><style>${DOC_CSS}</style></head><body>${bodyHtml}</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type ViewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "doc"; srcDoc: string } // md/html/text renderizados no iframe
  | { status: "pdf"; url: string }
  | { status: "image"; url: string };

export function MaterialViewer({
  material,
  onClose,
}: {
  material: LessonMaterial | null;
  onClose: () => void;
}) {
  const kind: MaterialKind = useMemo(
    () => (material ? materialKind(material.fileName, material.contentType) : "other"),
    [material],
  );
  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!material?.url) {
      setState({ status: "error", message: "Link do material indisponível." });
      return;
    }
    let objectUrl: string | null = null;
    let active = true;
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(material.url as string);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        if (kind === "markdown") {
          const text = await res.text();
          const html = await marked.parse(text, { gfm: true, async: true });
          if (active) setState({ status: "doc", srcDoc: wrapDoc(html) });
        } else if (kind === "html") {
          const text = await res.text();
          if (active)
            setState({
              status: "doc",
              srcDoc: isHtmlFragment(text) ? wrapDoc(text) : text,
            });
        } else if (kind === "text") {
          const text = await res.text();
          if (active)
            setState({
              status: "doc",
              srcDoc: wrapDoc(`<pre>${escapeHtml(text)}</pre>`),
            });
        } else {
          // pdf / image: usa blob → objectURL (ignora o Content-Disposition de
          // download do signed URL, que impediria o render inline).
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          if (active)
            setState(
              kind === "pdf"
                ? { status: "pdf", url: objectUrl }
                : { status: "image", url: objectUrl },
            );
        }
      } catch (err) {
        if (active)
          setState({
            status: "error",
            message:
              err instanceof Error
                ? `Não deu para carregar o material (${err.message}).`
                : "Não deu para carregar o material.",
          });
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [material, kind]);

  if (!material) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={material.label}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <div className={styles.headText}>
            <h2 className={styles.title}>{material.label}</h2>
            <p className={styles.fileName}>{material.fileName}</p>
          </div>
          <div className={styles.headActions}>
            {material.url ? (
              <a
                href={material.url}
                download={material.fileName}
                className={styles.downloadBtn}
              >
                <Download className="size-4" aria-hidden />
                Baixar
              </a>
            ) : null}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Fechar"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          {state.status === "loading" ? (
            <div className={styles.center}>
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <p>Carregando material…</p>
            </div>
          ) : state.status === "error" ? (
            <div className={styles.center}>
              <FileWarning className="size-6" aria-hidden />
              <p>{state.message}</p>
              {material.url ? (
                <a
                  href={material.url}
                  download={material.fileName}
                  className={styles.downloadBtn}
                >
                  <Download className="size-4" aria-hidden />
                  Baixar arquivo
                </a>
              ) : null}
            </div>
          ) : state.status === "image" ? (
            <div className={styles.imageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.url} alt={material.label} className={styles.image} />
            </div>
          ) : state.status === "pdf" ? (
            // <object> em vez de <iframe>: quando o aparelho não sabe abrir PDF
            // embutido (iOS e boa parte do Android), o iframe fica em branco e
            // o aluno acha que a apostila sumiu. O conteúdo abaixo é o que o
            // browser mostra nesse caso.
            <object
              className={styles.frame}
              data={state.url}
              type="application/pdf"
              aria-label={material.label}
            >
              <div className={styles.center}>
                <FileWarning className="size-6" aria-hidden />
                <p>Seu navegador não abre PDF aqui dentro.</p>
                <div className={styles.centerActions}>
                  <a
                    href={state.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.downloadBtn}
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    Abrir em nova aba
                  </a>
                  {material.url ? (
                    <a
                      href={material.url}
                      download={material.fileName}
                      className={styles.downloadBtn}
                    >
                      <Download className="size-4" aria-hidden />
                      Baixar
                    </a>
                  ) : null}
                </div>
              </div>
            </object>
          ) : (
            <iframe
              className={styles.frame}
              srcDoc={state.srcDoc}
              title={material.label}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
            />
          )}
        </div>
      </div>
    </div>
  );
}
