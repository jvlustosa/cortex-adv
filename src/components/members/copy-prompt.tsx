"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import styles from "./packs-area.module.css";

type CopyPromptProps = {
  text: string;
  label?: string;
};

/** Botão que copia um prompt pro clipboard, com feedback de "copiado". */
export function CopyPrompt({ text, label = "Copiar prompt" }: CopyPromptProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem clipboard (contexto inseguro): o aluno seleciona e copia manual.
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      className={styles.copyPromptBtn}
      aria-label={copied ? "Prompt copiado" : label}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}
