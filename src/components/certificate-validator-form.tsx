"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import {
  certificateVerifyPath,
  normalizeCertificateCode,
} from "@/lib/certificates/normalize";
import styles from "./certificate-validator.module.css";

type CertificateValidatorFormProps = {
  initialCode?: string;
  compact?: boolean;
};

export function CertificateValidatorForm({
  initialCode = "",
  compact = false,
}: CertificateValidatorFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeCertificateCode(code);

    if (!normalized) {
      setError("Informe o código do certificado.");
      return;
    }

    setError(null);
    router.push(certificateVerifyPath(normalized));
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <label className={styles.field}>
        {!compact && "Código de verificação"}
        <input
          type="text"
          name="codigo"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CA-2026-48271"
          autoComplete="off"
          spellCheck={false}
          className={styles.input}
          aria-invalid={error ? true : undefined}
        />
      </label>
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[#0a0a0a] transition hover:bg-[var(--accent-hover)]"
      >
        <Search className="size-4" aria-hidden />
        Validar certificado
      </button>
    </form>
  );
}
