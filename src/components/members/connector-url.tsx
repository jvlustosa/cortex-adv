"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import styles from "./packs-area.module.css";

type ConnectorUrlProps = {
  url: string;
};

/** URL do conector remoto com botão de copiar. */
export function ConnectorUrl({ url }: ConnectorUrlProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem clipboard (contexto inseguro): o aluno seleciona e copia manual.
    }
  }, [url]);

  return (
    <div className={styles.urlRow}>
      <code className={styles.urlCode}>{url}</code>
      <button
        type="button"
        onClick={copy}
        className={styles.copyBtn}
        aria-label={copied ? "URL copiada" : "Copiar URL do conector"}
      >
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
