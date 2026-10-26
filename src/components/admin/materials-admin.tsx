"use client";

import { Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { adminFetch } from "@/lib/admin/client-fetch";
import { formatAdminDate, formatBytes } from "@/lib/admin/format";
import { readApiErrorMessage } from "@/lib/errors/format";
import {
  MAX_MATERIAL_BYTES,
  MAX_MATERIAL_LABEL,
} from "@/lib/lessons/material-limits";
import type { MaterialAdminRow } from "@/lib/materials/admin-types";
import { useConfirm } from "./confirm-dialog";
import { SectionLoading } from "./admin-ui";
import styles from "./admin-dashboard.module.css";

/**
 * Aba "Materiais Didáticos": envia o PDF de cada apostila do catálogo. Texto,
 * categoria e capa vêm do código (src/data/materiais.ts) e entram por PR;
 * aqui só se cuida do arquivo. Apostila sem PDF não aparece para o aluno.
 */
export function MaterialsAdminPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MaterialAdminRow[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/materials");
      if (!res.ok) {
        throw new Error(
          await readApiErrorMessage(res, "Falha ao carregar as apostilas."),
        );
      }
      const data = (await res.json()) as { materials: MaterialAdminRow[] };
      setRows(data.materials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(row: MaterialAdminRow, file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Envie o arquivo em PDF.");
      return;
    }
    if (file.size > MAX_MATERIAL_BYTES) {
      toast.error(
        `Arquivo tem ${formatBytes(file.size)}. O limite é ${MAX_MATERIAL_LABEL}.`,
      );
      return;
    }
    if (row.stored) {
      const ok = await confirm({
        title: "Substituir PDF",
        message: `Trocar o PDF de "${row.title}"? Quem baixar a partir de agora recebe a versão nova.`,
        confirmLabel: "Substituir",
      });
      if (!ok) return;
    }

    setUploadingId(row.id);
    try {
      // 1) Pede o destino assinado. 2) Manda o arquivo do browser direto pro
      // Storage, sem passar pelo teto de ~4,5 MB da Vercel.
      const ticketRes = await adminFetch("/api/admin/materials/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          fileName: file.name,
          sizeBytes: file.size,
        }),
      });
      if (!ticketRes.ok) {
        throw new Error(
          await readApiErrorMessage(ticketRes, "Erro ao preparar o upload."),
        );
      }
      const ticket = (await ticketRes.json()) as {
        signedUrl: string;
        contentType: string;
      };

      let put: Response;
      try {
        put = await fetch(ticket.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": ticket.contentType },
          body: file,
        });
      } catch (netErr) {
        throw new Error(
          `O arquivo não chegou no Storage — falha de rede ou bloqueio do navegador${
            netErr instanceof Error ? `: ${netErr.message}` : "."
          }`,
        );
      }
      if (!put.ok) {
        const detail = await put.text().catch(() => "");
        throw new Error(
          `O arquivo não subiu (HTTP ${put.status}). ${detail.slice(0, 300)}`.trim(),
        );
      }

      toast.success(`PDF de "${row.title}" enviado.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar o PDF.");
    } finally {
      setUploadingId(null);
    }
  }

  if (loading) {
    return <SectionLoading label="Carregando apostilas…" />;
  }

  const withPdf = rows.filter((r) => r.stored).length;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        Materiais Didáticos
        <span className={styles.feedbackMeta}>
          {withPdf} de {rows.length} com PDF
        </span>
      </div>
      <p className={`${styles.hint} px-[1.1rem] pt-3`}>
        Título, descrição, categoria e capa vêm do código
        (src/data/materiais.ts) e entram por PR. Aqui você só envia ou troca o
        PDF. Apostila sem PDF não aparece para o aluno. Passo a passo em
        docs/materiais-didaticos.md.
      </p>

      {error ? (
        <p className={styles.empty} role="alert">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>Nenhuma apostila cadastrada no código.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Apostila</th>
                <th>Categoria</th>
                <th>Acesso</th>
                <th>PDF</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = uploadingId === row.id;
                return (
                  <tr key={row.id}>
                    <td>
                      <strong>
                        {row.id} · {row.title}
                      </strong>
                      <br />
                      <code className={styles.feedbackMeta}>{row.filePath}</code>
                    </td>
                    <td>{row.categoryTitle}</td>
                    <td>{row.exclusive ? "Exclusiva" : "Gratuita"}</td>
                    <td>
                      {row.stored ? (
                        <>
                          <span className={`${styles.badge} ${styles.badgeOn}`}>
                            No ar
                          </span>
                          <br />
                          <span className={styles.feedbackMeta}>
                            {formatBytes(row.stored.size)} ·{" "}
                            {formatAdminDate(row.stored.updatedAt)}
                          </span>
                        </>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeOff}`}>
                          Falta o PDF
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <label
                          className={styles.editBtn}
                          aria-disabled={uploadingId !== null}
                        >
                          {busy ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Upload className="size-3.5" aria-hidden />
                          )}
                          {row.stored ? "Trocar PDF" : "Enviar PDF"}
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="sr-only"
                            disabled={uploadingId !== null}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              // Limpa já: escolher o mesmo arquivo de novo
                              // precisa disparar onChange.
                              event.target.value = "";
                              if (file) void upload(row, file);
                            }}
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
